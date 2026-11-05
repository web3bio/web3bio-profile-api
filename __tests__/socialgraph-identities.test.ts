import { NextRequest } from "next/server";
import { GET } from "../app/api/socialgraph/identities/[handle]/route";
import { POST } from "../app/api/socialgraph/identities/route";
import { getQuery, postIdentityGraphQuery, QueryType } from "../utils/query";

jest.mock("../utils/base", () => ({}));
jest.mock("../app/api/profile/[handle]/utils", () => ({}));
jest.mock("../utils/query", () => ({
  ...jest.requireActual("../utils/query"),
  postIdentityGraphQuery: jest.fn(),
}));

const endpoint = "https://api.web3.bio/socialgraph/identities";
const headers = {
  "content-type": "application/json",
  "x-api-key": "Bearer test-key",
  "x-client-ip": "203.0.113.9",
};
const postQuery = jest.mocked(postIdentityGraphQuery);
const profile = (id: string) => ({
  id,
  uid: "12396",
  identity: id.slice(id.indexOf(",") + 1),
  platform: id.split(",")[0],
  network: "ethereum",
  address: "0x0000000000000000000000000000000000000001",
  avatar: null,
  description: null,
});
const result = (queryId: string) => ({
  queryId,
  profile: profile(queryId),
  associatedAccounts: queryId.startsWith("lens,")
    ? [profile("farcaster,suji"), profile("farcaster,sujibot")]
    : [],
});
const single = (handle: string) => GET(
  new NextRequest(`${endpoint}/${encodeURIComponent(handle)}`, { headers }),
  { params: Promise.resolve({ handle }) },
);
const batch = (queryIds: unknown) => POST(new NextRequest(endpoint, {
  method: "POST",
  headers,
  body: JSON.stringify({ queryIds }),
}));

beforeEach(() => {
  postQuery.mockReset();
  postQuery.mockImplementation(async (_headers, _query, variables) => ({
    ok: true,
    status: 200,
    statusText: "OK",
    body: {
      data: {
        batchAssociatedAccountsLookup: (variables.queryIds as string[]).map(result),
      },
    },
  }));
});

describe("SocialGraph associated identities", () => {
  it.each([
    "lens,sujiyan.lens",
    "lens,0xeb1f379c1aceecdd3a52ccbe856a7872475b31cb",
    "farcaster,#12396",
    "farcaster,zzfzz.eth",
  ])("looks up %s with one backend query", async (id) => {
    const response = await single(id);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(result(id));
    expect(response.headers.get("x-request-platform")).toBe(id.split(",")[0]);
    expect(postQuery).toHaveBeenCalledTimes(1);
    expect(postQuery).toHaveBeenCalledWith(
      { authorization: "Bearer test-key", "x-client-ip": "203.0.113.9" },
      getQuery(QueryType.GET_ASSOCIATED_ACCOUNTS),
      { queryIds: [id] },
    );
  });

  it("preserves mixed inputs, order, duplicates and one-to-many associations", async () => {
    const ids = ["farcaster,#12396", "lens,SujiYan.lens", "farcaster,#12396"];
    const response = await batch(ids);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(ids.map(result));
    expect(response.headers.get("x-request-platform")).toBeNull();
    expect(postQuery).toHaveBeenCalledTimes(1);
    expect(postQuery.mock.calls[0][2]).toEqual({ queryIds: ids });
  });

  it("accepts exactly 200 ids without per-id requests", async () => {
    const ids = Array.from({ length: 200 }, (_, i) => `farcaster,#${i + 1}`);
    const response = await batch(ids);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(ids.map(result));
    expect(postQuery).toHaveBeenCalledTimes(1);
  });

  it.each([
    undefined, null, [], {}, "lens,sujiyan.lens", [null], [123],
    ["ens,sujiyan.eth"], ["lens,"], ["lens, sujiyan.lens"], ["farcaster,a,b"],
    Array.from({ length: 201 }, (_, i) => `farcaster,#${i + 1}`),
  ])("rejects invalid batch input %# before querying", async (ids) => {
    const response = await batch(ids);
    expect(response.status).toBe(400);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(postQuery).not.toHaveBeenCalled();
  });

  it.each(["sujiyan.lens", "ethereum,0x123", "lens,"])(
    "rejects invalid single identity %s", async (id) => {
      expect((await single(id)).status).toBe(400);
      expect(postQuery).not.toHaveBeenCalled();
    },
  );

  it("rejects malformed JSON", async () => {
    const response = await POST(new NextRequest(endpoint, {
      method: "POST", headers, body: "{",
    }));
    expect(response.status).toBe(400);
    expect(postQuery).not.toHaveBeenCalled();
  });

  it("bounds streamed bodies even without a Content-Length", async () => {
    const bytes = new TextEncoder().encode(JSON.stringify({
      queryIds: ["lens,sujiyan.lens"], padding: "x".repeat(64 * 1024),
    }));
    const body = new ReadableStream({
      start(controller) {
        for (let i = 0; i < bytes.length; i += 8192) {
          controller.enqueue(bytes.slice(i, i + 8192));
        }
        controller.close();
      },
    });
    const response = await POST(new NextRequest(endpoint, {
      method: "POST", headers, body,
    }));
    expect(response.status).toBe(413);
    expect(postQuery).not.toHaveBeenCalled();
  });

  it("preserves a missing profile and empty associatedAccounts", async () => {
    const row = { queryId: "lens,missing.lens", profile: null, associatedAccounts: [] };
    postQuery.mockResolvedValue({
      ok: true, status: 200, statusText: "OK",
      body: { data: { batchAssociatedAccountsLookup: [row] } },
    });
    const response = await single(row.queryId);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(row);
  });

  it.each([
    { ok: false, status: 503, body: { msg: "Unavailable" }, expected: 503 },
    { ok: true, status: 200, body: { errors: [{ message: "Failed" }] }, expected: 500 },
    { ok: true, status: 200, body: { code: 429, msg: "Limited" }, expected: 429 },
    { ok: true, status: 200, body: null, expected: 502 },
  ])("preserves backend failures: $expected", async ({ ok, status, body, expected }) => {
    postQuery.mockResolvedValue({ ok, status, statusText: "", body });
    const response = await batch(["lens,sujiyan.lens"]);
    expect(response.status).toBe(expected);
    expect(response.headers.get("cache-control")).toBe("no-store");
  });

  it("handles backend request failures without retries", async () => {
    postQuery.mockRejectedValue(new Error("Network unavailable"));
    expect((await single("lens,sujiyan.lens")).status).toBe(500);
    expect(postQuery).toHaveBeenCalledTimes(1);
  });
});
