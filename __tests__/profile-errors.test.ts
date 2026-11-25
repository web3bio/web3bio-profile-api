import { NextRequest } from "next/server";
import { GET as universalProfile } from "@/app/api/profile/[handle]/route";
import { GET as ensProfile } from "@/app/api/profile/ens/[handle]/route";
import { GET as search } from "@/app/api/search/route";
import { GET as availability } from "@/app/api/search/availability/[handle]/route";
import { GET as socialGraph } from "@/app/api/socialgraph/[handle]/route";
import { GET as wallet } from "@/app/api/wallet/[handle]/route";
import { GET as domain } from "@/app/api/domain/[handle]/route";
import { GET as credential } from "@/app/api/credential/[handle]/route";
import { GET as badge } from "@/app/api/badge/[handle]/route";
import { GET as profileBatch } from "@/app/api/profile/batch/[ids]/route";
import { GET as nsBatch } from "@/app/api/ns/batch/[ids]/route";
import { GET as universalBatch } from "@/app/api/ns/batch/universal/[ids]/route";
import { GET as suggest } from "@/app/api/search/suggest/[name]/route";

describe.each([
  ["/profile/pugson.eth", universalProfile],
  ["/profile/ens/pugson.eth", ensProfile],
  ["/wallet/pugson.eth", wallet],
  ["/domain/pugson.eth", domain],
  ["/credential/pugson.eth", credential],
  ["/badge/pugson.eth", badge],
] as const)("Single-identity upstream errors: %s", (path, getProfile) => {
  let fetchMock: jest.SpyInstance;

  beforeEach(() => {
    fetchMock = jest.spyOn(globalThis, "fetch");
  });

  afterEach(() => jest.restoreAllMocks());

  it.each([
    ["network error", () => Promise.reject(new TypeError("fetch failed")), 502],
    ["timeout", () => Promise.reject(new DOMException("Timed out", "TimeoutError")), 504],
    ["invalid JSON", async () => new Response("<html>upstream error</html>"), 502],
    ["null body", async () => Response.json(null), 502],
    ["invalid envelope", async () => Response.json({}), 502],
    ["empty data", async () => Response.json({ data: {} }), 502],
    ["null data", async () => Response.json({ data: null }), 502],
    ["null errors", async () => Response.json({ errors: null }), 502],
    ["empty message", async () => Response.json({ msg: "" }), 502],
    ["missing identity field", async () => Response.json({ data: { other: null } }), 502],
    ["invalid identity type", async () => Response.json({ data: { identity: false } }), 502],
    ["invalid identity array", async () => Response.json({ data: { identity: [] } }), 502],
    ["upstream unavailable", async () => new Response("Unavailable", { status: 503 }), 503],
    ["error with a success code", async () => Response.json({ errors: ["unavailable"], code: 200 }), 500],
    ["message without data", async () => Response.json({ msg: "unavailable" }), 500],
    ["misleading body code", async () => Response.json({ msg: "unavailable", code: 404 }, { status: 503 }), 503],
  ] as const)("returns uncached JSON for %s", async (_, fetchResult, status) => {
    fetchMock.mockImplementation(fetchResult);
    const response = await getProfile(
      new NextRequest(`https://api.web3.bio${path}`),
      { params: Promise.resolve({ handle: "pugson.eth" }) },
    );
    expect(response.status).toBe(status);
    expect(response.headers.get("content-type")).toContain("application/json");
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(await response.json()).toMatchObject({
      identity: "pugson.eth",
      platform: "ens",
      error: expect.any(String),
    });
  });

  it("preserves a real not-found response", async () => {
    fetchMock.mockResolvedValue(Response.json({ data: { identity: null } }));
    const response = await getProfile(
      new NextRequest(`https://api.web3.bio${path}`),
      { params: Promise.resolve({ handle: "pugson.eth" }) },
    );
    expect(response.status).toBe(404);
  });

  it("does not swallow a timeout while reading the JSON body", async () => {
    const controller = new AbortController();
    jest.spyOn(AbortSignal, "timeout").mockReturnValue(controller.signal);
    const response = Response.json({});
    jest.spyOn(response, "json").mockImplementation(async () => {
      controller.abort(new DOMException("Timed out", "TimeoutError"));
      throw controller.signal.reason;
    });
    fetchMock.mockResolvedValue(response);
    const result = await getProfile(
      new NextRequest(`https://api.web3.bio${path}`),
      { params: Promise.resolve({ handle: "pugson.eth" }) },
    );
    expect(result.status).toBe(504);
    expect(await result.json()).toMatchObject({ error: expect.any(String) });
  });
});

describe("Shared Identity Graph response errors", () => {
  afterEach(() => jest.restoreAllMocks());

  it.each([
    ["/search?platform=ens&identity=pugson.eth", search],
    ["/search/availability/pugson", availability],
    ["/socialgraph/lens,pugson", socialGraph],
  ] as const)("preserves 502 for %s", async (path, getResponse) => {
    jest.spyOn(globalThis, "fetch").mockResolvedValue(new Response("<html>upstream error</html>"));
    const response = await getResponse(
      new NextRequest(`https://api.web3.bio${path}`),
      { params: Promise.resolve({ handle: path.split("/").pop()! }) },
    );
    expect(response.status).toBe(502);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(await response.json()).toMatchObject({ error: "Invalid Identity Graph response" });
  });
  it.each([
    ["/search?platform=ens&identity=pugson.eth", search, { identity: { platform: "ens", identity: "pugson.eth" } }],
    ["/search/availability/pugson", availability, { domainAvailableSearch: [] }],
    ["/socialgraph/lens,pugson", socialGraph, { socialGraphCrossPlatformRecommendation: { source: "lens,pugson" } }],
  ] as const)("distinguishes a success code from a missing result field on %s", async (path, getResponse, data) => {
    const call = () => getResponse(new NextRequest(`https://api.web3.bio${path}`), {
      params: Promise.resolve({ handle: path.split("/").pop()! }),
    });
    jest.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(Response.json({ data, code: 200 }))
      .mockResolvedValueOnce(Response.json({ data: {} }));
    expect((await call()).status).toBe(200);
    expect((await call()).status).toBe(502);
  });

});

describe.each([
  ["/profile/batch", profileBatch, "identities"],
  ["/ns/batch", nsBatch, "identities"],
  ["/ns/batch/universal", universalBatch, "identitiesWithGraph"],
] as const)("Batch result and billing status for %s", (path, getBatch, field) => {
  const rawIds = JSON.stringify(Array.from({ length: 10 }, (_, i) => `ens,user${i}.eth`));
  const query = (ids = rawIds) => getBatch(new NextRequest(`https://api.web3.bio${path}/${encodeURIComponent(ids)}`), {
    params: Promise.resolve({ ids }),
  });
  afterEach(() => jest.restoreAllMocks());

  it.each([
    ["unavailable", async () => new Response("Unavailable", { status: 503 }), 503],
    ["network error", async () => { throw new TypeError("fetch failed"); }, 502],
    ["timeout", async () => { throw new DOMException("Timed out", "TimeoutError"); }, 504],
    ["GraphQL error", async () => Response.json({ errors: [{ message: "unavailable" }], code: 200 }), 500],
    ["rate limited", async () => Response.json({ msg: "limited", code: 429 }), 429],
    ["invalid JSON", async () => new Response("unavailable"), 502],
    ["missing result", async () => Response.json({ data: {} }), 502],
    ["null result", async () => Response.json({ data: { [field]: null } }), 502],
    ["partial failure without usable records", async () => Response.json({
      data: { [field]: [{ identity: "user0.eth", profile: { identity: "user0.eth" } }] },
      errors: [{ path: [field, 0, "profile", "platform"], message: "lookup failed" }],
    }), 500],
    ["not found", async () => new Response(null, { status: 404 }), 404],
  ] as const)("preserves the HTTP status for %s", async (_, result, status) => {
    jest.spyOn(globalThis, "fetch").mockImplementation(result);
    const response = await query();
    expect(response.status).toBe(status);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
  });

  it("sends ten identities in a single lookup and preserves a successful empty list", async () => {
    const fetch = jest.spyOn(globalThis, "fetch").mockResolvedValue(Response.json({ data: { [field]: [] } }));
    const response = await query(encodeURIComponent(rawIds));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual([]);
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(JSON.parse(String(fetch.mock.calls[0][1]?.body)).variables.ids).toHaveLength(10);
  });

  it("keeps usable identities in a partially successful batch", async () => {
    const profile = { platform: "ens", identity: "user0.eth", address: "0x0000000000000000000000000000000000000001" };
    const row = { ...profile, profile, aliases: [], resolvedAddress: [], ownerAddress: [] };
    jest.spyOn(globalThis, "fetch").mockResolvedValue(Response.json({
      data: { [field]: [row, null] }, errors: [{ path: [field, 1], message: "lookup failed" }],
    }));
    const response = await query();
    expect(response.status).toBe(200);
    const results = await response.json();
    expect(results).toHaveLength(1);
    expect(field === "identities" ? results[0].identity : results[0].profiles[0].identity).toBe("user0.eth");
  });

  it("accepts the documented 30 identities and rejects 31 before fetching", async () => {
    const fetch = jest.spyOn(globalThis, "fetch").mockResolvedValue(Response.json({ data: { [field]: [] } }));
    const ids = Array.from({ length: 31 }, (_, i) => `ens,user${i}.eth`);
    expect((await query(JSON.stringify(ids))).status).toBe(400);
    expect(fetch).not.toHaveBeenCalled();
    expect((await query(JSON.stringify(ids.slice(0, 30)))).status).toBe(200);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it.each(["%", "[", "null", "[1]"])("returns 400 for invalid input %s before querying", async ids => {
    const fetch = jest.spyOn(globalThis, "fetch");
    expect((await query(ids)).status).toBe(400);
    expect(fetch).not.toHaveBeenCalled();
  });
});

describe("Search suggestions", () => {
  const query = () => suggest(new NextRequest("https://api.web3.bio/search/suggest/alice"), {
    params: Promise.resolve({ name: "alice" }),
  });
  afterEach(() => jest.restoreAllMocks());

  it("preserves the upstream error and accepts an empty list of suggestions", async () => {
    jest.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(new Response(null, { status: 503 }))
      .mockResolvedValueOnce(Response.json({ data: { nameSuggest: [] } }));
    expect((await query()).status).toBe(503);
    const response = await query();
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual([]);
  });
});
