import { NextRequest } from "next/server";
import { GET } from "../app/api/socialgraph/following/[targetPlatform]/[handle]/route";
import { getQuery, postIdentityGraphQuery, QueryType } from "../utils/query";

jest.mock("../utils/base", () => ({}));
jest.mock("../app/api/profile/[handle]/utils", () => ({}));
jest.mock("../utils/query", () => ({
  ...jest.requireActual("../utils/query"),
  postIdentityGraphQuery: jest.fn(),
}));

const endpoint = "https://api.web3.bio/socialgraph/following";
const headers = { "x-api-key": "Bearer test-key", "x-client-ip": "203.0.113.9" };
const postQuery = jest.mocked(postIdentityGraphQuery);
const result = {
  queryId: "farcaster,#12396",
  pagination: { total: 1, hasMore: false, page: 0, limit: 200 },
  profile: { id: "farcaster,suji", uid: "12396" },
  following: [{
    queryId: "farcaster,alice",
    profile: { id: "farcaster,alice", uid: "1" },
    associatedAccounts: [{ id: "lens,alice.lens", identity: "alice.lens" }],
  }],
};
const request = (targetPlatform: string, handle: string, query = "") => GET(
  new NextRequest(`${endpoint}/${targetPlatform}/${encodeURIComponent(handle)}${query}`, { headers }),
  { params: Promise.resolve({ targetPlatform, handle }) },
);

beforeEach(() => {
  postQuery.mockReset();
  postQuery.mockResolvedValue({
    ok: true, status: 200, statusText: "OK",
    body: { data: { searchFollowingAssociatedAccounts: result } },
  });
});

describe("SocialGraph following associated accounts", () => {
  it.each([
    ["lens", "farcaster,#12396"],
    ["lens", "farcaster,suji"],
    ["farcaster", "lens,sujiyan.lens"],
    ["farcaster", "lens,0xeb1f379c1aceecdd3a52ccbe856a7872475b31cb"],
  ])("queries target %s for %s with one backend request", async (target, handle) => {
    const response = await request(target, handle);
    const [sourcePlatform, sourceIdentity] = handle.split(",");
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(result);
    expect(response.headers.get("x-request-platform")).toBe(sourcePlatform);
    expect(postQuery).toHaveBeenCalledTimes(1);
    expect(postQuery).toHaveBeenCalledWith(
      { authorization: "Bearer test-key", "x-client-ip": "203.0.113.9" },
      getQuery(QueryType.GET_FOLLOWING_ASSOCIATED_ACCOUNTS),
      { sourcePlatform, sourceIdentity, targetPlatform: target, page: 0, totalPage: 200 },
    );
  });

  it.each([1, 50, 200])("preserves identity case and forwards limit %i", async (limit) => {
    const response = await request("farcaster", "lens,SujiYan.lens", `?page=2&limit=${limit}`);
    expect(response.status).toBe(200);
    expect(postQuery.mock.calls[0][2]).toEqual({
      sourcePlatform: "lens", sourceIdentity: "SujiYan.lens",
      targetPlatform: "farcaster", page: 2, totalPage: limit,
    });
  });

  it.each([
    ["ethereum", "farcaster,suji"], ["lens", "ens,sujiyan.eth"],
    ["lens", "lens,sujiyan.lens"], ["farcaster", "farcaster,suji"],
    ["lens", "suji"], ["lens", "farcaster,"], ["lens", "farcaster, suji"],
    ["lens", "farcaster,suji,other"],
  ])("rejects invalid target/source %s / %s", async (target, handle) => {
    const response = await request(target, handle);
    expect(response.status).toBe(400);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(postQuery).not.toHaveBeenCalled();
  });

  it.each([
    "?page=-1", "?page=0.5", "?page=abc", "?page=", "?page=9007199254740992",
    "?limit=0", "?limit=201", "?limit=-1", "?limit=1.5", "?limit=abc", "?limit=",
  ])("rejects invalid pagination %s before querying", async (query) => {
    expect((await request("lens", "farcaster,suji", query)).status).toBe(400);
    expect(postQuery).not.toHaveBeenCalled();
  });

  it("returns an empty following list and missing profile unchanged", async () => {
    const empty = { ...result, profile: null, following: [], pagination: null };
    postQuery.mockResolvedValue({
      ok: true, status: 200, statusText: "OK",
      body: { data: { searchFollowingAssociatedAccounts: empty } },
    });
    const response = await request("lens", "farcaster,suji");
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(empty);
  });

  it.each([
    { ok: false, status: 503, body: { msg: "Unavailable" }, expected: 503 },
    { ok: true, status: 200, body: { code: 429, msg: "Limited" }, expected: 429 },
    { ok: true, status: 200, body: { errors: [{ message: "Failed" }] }, expected: 500 },
    { ok: true, status: 200, body: { data: { searchFollowingAssociatedAccounts: null } }, expected: 404 },
    { ok: true, status: 200, body: null, expected: 502 },
    { ok: true, status: 200, body: { data: {} }, expected: 502 },
    { ok: true, status: 200, body: { data: { searchFollowingAssociatedAccounts: {} } }, expected: 502 },
    { ok: true, status: 200, body: { data: { searchFollowingAssociatedAccounts: { queryId: "farcaster,suji", following: null } } }, expected: 502 },
  ])("preserves backend failure $expected", async ({ ok, status, body, expected }) => {
    postQuery.mockResolvedValue({ ok, status, statusText: "", body });
    const response = await request("lens", "farcaster,suji");
    expect(response.status).toBe(expected);
    expect(response.headers.get("cache-control")).toBe("no-store");
  });

  it("handles network errors without retrying", async () => {
    postQuery.mockRejectedValue(new Error("Network unavailable"));
    const response = await request("lens", "farcaster,suji");
    expect(response.status).toBe(500);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(postQuery).toHaveBeenCalledTimes(1);
  });
});
