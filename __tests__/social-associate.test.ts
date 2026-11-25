import { Kind, parse, visit } from "graphql";
import { NextRequest } from "next/server";
import { GET } from "../app/api/social/associate/[identity]/route";
import { GET as getBesties } from "../app/api/social/besties/[handle]/route";

const endpoint = "https://api.web3.bio/social/associate";
const request = (identity: string, query = "") => GET(
  new NextRequest(`${endpoint}/${encodeURIComponent(identity)}${query}`),
  { params: Promise.resolve({ identity }) },
);
const followTypes = ["no", "outgoing", "incoming", "mutual"];
const accounts = [{ identity: "alice.lens" }, { identity: "alice-alt.lens" }];
const result = {
  queryId: "farcaster,#16970",
  profile: { uid: "16970", identity: "wealthfiles", platform: "farcaster" },
  pagination: { page: 0, limit: 100, total: 4, hasMore: false },
  besties: followTypes.map((followType, i) => ({
    queryId: `farcaster,#${i + 1}`,
    profile: { uid: String(i + 1), identity: `user${i}` },
    score: { bestiesScore: 4 - i, followType, commentCount: 1, mentionCount: 2, shareCount: 3, likeCount: 4 },
    associatedAccounts: i === 0 ? accounts : null,
  })),
};

const graph = jest.spyOn(globalThis, "fetch");
const graphResponse = (page: unknown) => Response.json({ data: { searchBestiesAssociatedAccounts: page } });
beforeEach(() => {
  graph.mockReset().mockResolvedValue(graphResponse(result));
});
afterAll(() => graph.mockRestore());

it("flattens profiles, pagination and scores while preserving ranking and all associated accounts", async () => {
  const response = await request("#16970");
  expect(response.status).toBe(200);
  expect(response.headers.get("x-request-platform")).toBe("farcaster");
  expect(await response.json()).toEqual({
    queryId: "farcaster,#16970", uid: "16970", identity: "wealthfiles", platform: "farcaster",
    total: 4, page: 0, limit: 100, hasMore: false,
    besties: followTypes.map((followType, i) => ({
      queryId: `farcaster,#${i + 1}`, uid: String(i + 1), identity: `user${i}`,
      bestiesScore: 4 - i, followType, commentCount: 1, mentionCount: 2, shareCount: 3, likeCount: 4,
      associatedAccounts: i === 0 ? accounts : [],
    })),
  });
  expect(graph).toHaveBeenCalledTimes(1);
  const { query, variables } = JSON.parse(String(graph.mock.calls[0][1]?.body));
  expect(variables).toEqual({ sourceIdentity: "#16970", page: 0, totalPage: 100, includeDetails: true });
  const fields: Record<string, string[]> = {};
  visit(parse(query), {
    Field({ name, selectionSet }) {
      if (selectionSet) fields[name.value] = selectionSet.selections
        .filter(field => field.kind === Kind.FIELD).map(field => field.name.value);
    },
  });
  expect(fields.searchBestiesAssociatedAccounts).toEqual(expect.arrayContaining(["queryId", "profile", "pagination", "besties"]));
  expect(fields.besties).toEqual(expect.arrayContaining(["queryId", "profile", "score", "associatedAccounts"]));
  expect(fields.score.sort()).toEqual(Object.keys(result.besties[0].score).sort());
});

it.each([["alice", "alice"], ["farcaster,alice", "alice"], ["farcaster,#16970", "#16970"]])(
  "reads %s from the path and forwards pagination", async (handle, sourceIdentity) => {
    expect((await request(handle, "?page=2&limit=200")).status).toBe(200);
    expect(JSON.parse(String(graph.mock.calls[0][1]?.body)).variables)
      .toMatchObject({ sourceIdentity, page: 2, totalPage: 200 });
  },
);

it("keeps the original besties response and avoids fetching its unused details", async () => {
  const handle = "farcaster,alice";
  const nested = {
    pagination: result.pagination, profile: null,
    besties: [{ profile: null, associatedAccounts: accounts }],
  };
  graph.mockResolvedValueOnce(graphResponse(nested));
  const response = await getBesties(new NextRequest(`https://api.web3.bio/social/besties/${handle}`), {
    params: Promise.resolve({ handle }),
  });
  expect(await response.json()).toEqual(nested);
  expect(JSON.parse(String(graph.mock.calls[0][1]?.body)).variables)
    .toMatchObject({ sourceIdentity: "alice", includeDetails: false });
  const bare = await getBesties(new NextRequest("https://api.web3.bio/social/besties/alice"), {
    params: Promise.resolve({ handle: "alice" }),
  });
  expect(bare.status).toBe(400);
  expect(graph).toHaveBeenCalledTimes(1);
});

it.each([["#abc", ""], ["lens,alice", ""], ["farcaster,farcaster,#1", ""], ["alice", "?page=-1"], ["alice", "?limit=201"]])(
  "rejects invalid input before querying the graph (%s %s)", async (identity, query) => {
    const response = await request(identity, query);
    expect(response.status).toBe(400);
    expect((await response.json()).identity).toBe(identity);
    expect(graph).not.toHaveBeenCalled();
  },
);

it("returns a known source with no besties as an empty page", async () => {
  graph.mockResolvedValueOnce(graphResponse({ ...result, pagination: { ...result.pagination, total: 0 }, besties: [] }));
  const response = await request("#16970");
  expect(response.status).toBe(200);
  expect(await response.json()).toMatchObject({ queryId: result.queryId, total: 0, besties: [] });
});

it.each([[null, 404], [{}, 502]] as const)("handles a missing or malformed graph result", async (page, status) => {
  graph.mockResolvedValueOnce(graphResponse(page));
  expect((await request("alice")).status).toBe(status);
  expect(graph).toHaveBeenCalledTimes(1);
});
