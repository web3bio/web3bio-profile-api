import { NextRequest } from "next/server";
import { GET as universalProfile } from "@/app/api/profile/[handle]/route";
import { GET as ensProfile } from "@/app/api/profile/ens/[handle]/route";

describe.each([
  ["/profile/pugson.eth", universalProfile],
  ["/profile/ens/pugson.eth", ensProfile],
] as const)("Profile upstream errors: %s", (path, getProfile) => {
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
    ["upstream unavailable", async () => new Response("Unavailable", { status: 503 }), 503],
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
    expect(await result.json()).toMatchObject({ error: "Identity Graph request timed out" });
  });
});
