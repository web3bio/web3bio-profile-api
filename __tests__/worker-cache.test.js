import { jwtVerify } from "jose";
import openNextHandler from "../.open-next/worker.js";
import worker from "../worker";
import {
  purgeWorkerCache,
  workerCacheKey,
} from "../utils/cloudflare-cache";

jest.mock("jose", () => ({ jwtVerify: jest.fn() }));
jest.mock(
  "../.open-next/worker.js",
  () => ({ __esModule: true, default: { fetch: jest.fn() } }),
  { virtual: true },
);

describe("Worker response caching", () => {
  const origin = "https://api.web3.bio";
  const solana = "4JBz4tAKgAmxjDPHHi9HRLj14RsCQJyuCkCFKnpz7B9s";
  const originalCaches = Object.getOwnPropertyDescriptor(globalThis, "caches");
  let cache;
  let env;
  let pending;

  const request = async (path, init) => {
    const response = await worker.fetch(new Request(origin + path, init), env, {
      waitUntil: (promise) => pending.push(promise),
    });
    await Promise.all(pending.splice(0));
    return response;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    const entries = new Map();
    pending = [];
    cache = {
      match: jest.fn(async (key) => entries.get(key.url)?.clone()),
      put: jest.fn(async (key, response) => entries.set(key.url, response)),
      delete: jest.fn(async (key) => entries.delete(key.url)),
    };
    Object.defineProperty(globalThis, "caches", {
      configurable: true,
      value: { default: cache },
    });
    env = { API_RATE_LIMIT: { limit: jest.fn(async () => ({ success: true })) } };
    jwtVerify.mockResolvedValue({ payload: { role: 8 } });
    openNextHandler.fetch.mockImplementation(async () =>
      Response.json(
        [{ identity: "alice.eth", platform: "ens" }],
        { headers: { "x-request-platform": "ens", Vary: "Origin" } },
      ),
    );
  });

  afterAll(() => {
    if (originalCaches) {
      Object.defineProperty(globalThis, "caches", originalCaches);
    } else {
      delete globalThis.caches;
    }
  });

  it("serves an identical cached GET with the original response headers", async () => {
    const first = await request("/profile/alice.eth");
    const second = await request("/profile/alice.eth");
    expect(await second.json()).toEqual(await first.json());
    expect(second.headers.get("x-cache-hit")).toBe("HIT");
    expect(second.headers.get("x-request-platform")).toBe("ens");
    expect(second.headers.get("vary")).toBe("Origin, Accept-Encoding");
    expect(openNextHandler.fetch).toHaveBeenCalledTimes(1);
  });

  it("caches a bodyless avatar redirect without changing its target or status", async () => {
    openNextHandler.fetch.mockImplementation(async () =>
      Response.redirect("https://images.example/avatar.png", 307),
    );
    await request("/avatar/alice.eth");
    const second = await request("/avatar/alice.eth");
    expect(second.status).toBe(307);
    expect(second.headers.get("location")).toBe("https://images.example/avatar.png");
    expect(second.headers.get("x-cache-hit")).toBe("HIT");
    expect(await second.text()).toBe("");
    expect(openNextHandler.fetch).toHaveBeenCalledTimes(1);
  });

  it.each([404, 429, 500, 502])(
    "does not advertise or store a %i response as public",
    async (status) => {
      openNextHandler.fetch.mockImplementation(async () =>
        Response.json({ error: "original error" }, { status }),
      );
      const response = await request("/profile/alice.eth");
      expect(response.status).toBe(status);
      expect(await response.json()).toEqual({ error: "original error" });
      expect(response.headers.get("cache-control")).toBe("no-store");
      expect(cache.put).not.toHaveBeenCalled();
    },
  );

  it.each([
    { "Cache-Control": "no-store" },
    { "Cache-Control": "private, max-age=60" },
    { "Cache-Control": "no-cache" },
    { "Set-Cookie": "session=example" },
    { Vary: "*" },
  ])("respects a non-shareable response: %j", async (headers) => {
    openNextHandler.fetch.mockResolvedValue(
      Response.json({ message: "unchanged" }, { headers }),
    );
    const response = await request("/avatar/alice.eth");
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ message: "unchanged" });
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(cache.put).not.toHaveBeenCalled();
  });

  it.each(["POST", "OPTIONS"])("does not reuse GET data for %s", async (method) => {
    await request("/profile/alice.eth");
    openNextHandler.fetch.mockResolvedValue(new Response(null, { status: 204 }));
    const response = await request("/profile/alice.eth", { method });
    expect(response.status).toBe(204);
    expect(await response.text()).toBe("");
    expect(cache.match).toHaveBeenCalledTimes(1);
    expect(cache.put).toHaveBeenCalledTimes(1);
  });

  it("returns HEAD headers without the cached GET body", async () => {
    await request("/profile/alice.eth");
    const response = await request("/profile/alice.eth", { method: "HEAD" });
    expect(response.status).toBe(200);
    expect(response.body).toBeNull();
    expect(response.headers.get("x-cache-hit")).toBe("HIT");
    expect(openNextHandler.fetch).toHaveBeenCalledTimes(1);
  });

  it("does not populate the GET cache from a HEAD miss", async () => {
    openNextHandler.fetch.mockResolvedValue(new Response(null, { status: 200 }));
    await request("/profile/alice.eth", { method: "HEAD" });
    expect(cache.put).not.toHaveBeenCalled();
  });

  it("serves the same cached JSON to browser and AI user agents", async () => {
    const browser = await request("/profile/alice.eth", {
      headers: { "user-agent": "Mozilla/5.0" },
    });
    const expected = await browser.json();
    for (const userAgent of ["ChatGPT-User/1.0", "OAI-SearchBot/1.3", "Claude-User/1.0"]) {
      const response = await request("/profile/alice.eth", {
        headers: { "user-agent": userAgent },
      });
      expect(response.status).toBe(200);
      expect(response.headers.get("content-type")).toContain("application/json");
      expect(response.headers.get("x-cache-hit")).toBe("HIT");
      expect(await response.json()).toEqual(expected);
    }
    expect(openNextHandler.fetch).toHaveBeenCalledTimes(1);
  });

  it("accepts key-header preflight without consuming quota or fetching data", async () => {
    env.API_RATE_LIMIT.limit.mockResolvedValue({ success: false });
    const response = await request("/profile/web2/alice.eth", {
      method: "OPTIONS",
      headers: {
        origin: "https://client.example",
        "access-control-request-method": "GET",
        "access-control-request-headers": "x-api-key",
      },
    });
    expect(response.status).toBe(204);
    expect(response.headers.get("access-control-allow-headers")).toContain("X-Api-Key");
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(env.API_RATE_LIMIT.limit).not.toHaveBeenCalled();
    expect(cache.match).not.toHaveBeenCalled();
    expect(openNextHandler.fetch).not.toHaveBeenCalled();
    const denied = await request("/profile/web2/alice.eth");
    expect(denied.status).toBe(403);
    expect(denied.headers.get("access-control-allow-origin")).toBe("*");
  });

  it("returns readable rate-limit errors and a retry delay for AI clients", async () => {
    env.API_RATE_LIMIT.limit.mockResolvedValue({ success: false });
    const response = await request("/profile/alice.eth", {
      headers: { "user-agent": "ChatGPT-User/1.0" },
    });
    expect(response.status).toBe(429);
    expect(response.headers.get("retry-after")).toBe("10");
    expect(response.headers.get("access-control-expose-headers")).toContain("Retry-After");
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect((await response.json()).error).toContain("Too Many Requests");
    expect(openNextHandler.fetch).not.toHaveBeenCalled();
    expect(cache.match).not.toHaveBeenCalled();
    const authorized = await request("/profile/alice.eth", {
      headers: { "x-api-key": "valid", "user-agent": "ChatGPT-User/1.0" },
    });
    expect(authorized.status).toBe(200);
    expect(env.API_RATE_LIMIT.limit).toHaveBeenCalledTimes(1);
  });

  it("keeps authorization ahead of cache lookup", async () => {
    await request("/wallet/alice.eth", { headers: { "x-api-key": "valid" } });
    const response = await request("/wallet/alice.eth");
    expect(response.status).toBe(403);
    expect(cache.match).toHaveBeenCalledTimes(1);
    expect(openNextHandler.fetch).toHaveBeenCalledTimes(1);
  });

  it("still rejects invalid tokens and rate-limited requests on cache hits", async () => {
    await request("/profile/alice.eth");
    jwtVerify.mockRejectedValueOnce(new Error("invalid"));
    const invalid = await request("/profile/alice.eth", {
      headers: { "x-api-key": "invalid" },
    });
    expect(invalid.status).toBe(403);
    env.API_RATE_LIMIT.limit.mockResolvedValueOnce({ success: false });
    expect((await request("/profile/alice.eth")).status).toBe(429);
    expect(cache.match).toHaveBeenCalledTimes(1);
  });

  it("bypasses caching for refresh and purges matching case-sensitive keys", async () => {
    const path = `/profile/solana/${solana}`;
    await request(path);
    await purgeWorkerCache("solana", solana, origin);
    expect(await cache.match(workerCacheKey(path, origin))).toBeUndefined();
    cache.match.mockClear();
    cache.put.mockClear();
    const response = await request(`/refresh/solana,${solana}`, {
      headers: { "x-api-key": "valid" },
    });
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(cache.match).not.toHaveBeenCalled();
    expect(cache.put).not.toHaveBeenCalled();
  });

  it("falls back to the handler when cache lookup fails", async () => {
    cache.match.mockRejectedValueOnce(new Error("cache unavailable"));
    const log = jest.spyOn(console, "error").mockImplementation(() => {});
    try {
      const response = await request("/profile/alice.eth");
      expect(response.status).toBe(200);
      expect(await response.json()).toEqual([{ identity: "alice.eth", platform: "ens" }]);
    } finally {
      log.mockRestore();
    }
  });

  it("normalizes identity case while preserving exempt addresses", () => {
    expect(workerCacheKey(`${origin}/profile/Alice.ETH`).url).toBe(
      workerCacheKey(`${origin}/profile/alice.eth`).url,
    );
    expect(workerCacheKey(`${origin}/profile/solana/${solana}`).url).not.toBe(
      workerCacheKey(`${origin}/profile/solana/${solana.toLowerCase()}`).url,
    );
    expect(workerCacheKey(`${origin}/profile/${solana}.solana`).url).toBe(
      `${origin}/profile/${solana}.solana`,
    );
    expect(workerCacheKey(`${origin}/search?platform=ens&identity=Alice.ETH`).url).toBe(
      workerCacheKey(`${origin}/search?identity=alice.eth&platform=ens`).url,
    );
  });

  it("caches identity GETs for 30 days without changing the echoed queryId", async () => {
    openNextHandler.fetch.mockImplementation(async (req) => Response.json({
      queryId: decodeURIComponent(new URL(req.url).pathname.split("/").pop()),
      profile: null,
      associatedAccounts: [],
    }));
    const path = "/socialgraph/identities/lens,sujiyan.lens";
    await request(path);
    const hit = await request(path);
    expect(hit.headers.get("x-cache-hit")).toBe("HIT");
    expect(hit.headers.get("cache-control")).toContain("max-age=2592000");
    const mixed = await request("/socialgraph/identities/lens,SujiYan.lens");
    expect((await mixed.json()).queryId).toBe("lens,SujiYan.lens");
    expect(openNextHandler.fetch).toHaveBeenCalledTimes(2);
    await purgeWorkerCache("lens", "sujiyan.lens", origin);
    expect(await cache.match(workerCacheKey(path, origin))).toBeUndefined();
  });

  it("never caches POST identity batches under their shared URL", async () => {
    openNextHandler.fetch.mockImplementation(async (req) =>
      Response.json((await req.json()).queryIds),
    );
    for (const id of ["lens,sujiyan.lens", "farcaster,#12396"]) {
      const response = await request("/socialgraph/identities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ queryIds: [id] }),
      });
      expect(await response.json()).toEqual([id]);
      expect(response.headers.get("cache-control")).toBe("no-store");
    }
    expect(openNextHandler.fetch).toHaveBeenCalledTimes(2);
    expect(cache.match).not.toHaveBeenCalled();
    expect(cache.put).not.toHaveBeenCalled();
  });

  it.each(["farcaster", "%66arcaster"])("caches following GETs for target %s while preserving queryId case and pagination", async (target) => {
    openNextHandler.fetch.mockImplementation(async (req) => {
      const url = new URL(req.url);
      return Response.json({
        queryId: decodeURIComponent(url.pathname.split("/").pop()),
        pagination: { page: Number(url.searchParams.get("page") || 0) },
        following: [],
      });
    });
    const path = `/socialgraph/following/${target}/lens,SujiYan.lens?page=0&limit=50`;
    await request(path);
    const hit = await request(path);
    expect(hit.headers.get("x-cache-hit")).toBe("HIT");
    expect(hit.headers.get("cache-control")).toContain("max-age=2592000");
    expect((await hit.json()).queryId).toBe("lens,SujiYan.lens");
    const lower = await request(path.replace("SujiYan", "sujiyan"));
    expect((await lower.json()).queryId).toBe("lens,sujiyan.lens");
    const next = await request(path.replace("page=0", "page=1"));
    expect((await next.json()).pagination.page).toBe(1);
    await request(path.replace("limit=50", "limit=100"));
    expect(openNextHandler.fetch).toHaveBeenCalledTimes(4);
  });

  it("normalizes qualified platform prefixes without merging case-sensitive SVGs", () => {
    expect(workerCacheKey(`${origin}/profile/ENS,Alice.ETH`).url).toBe(
      workerCacheKey(`${origin}/profile/ens,alice.eth`).url,
    );
    expect(workerCacheKey(`${origin}/avatar/svg/Alice.eth`).url).not.toBe(
      workerCacheKey(`${origin}/avatar/svg/alice.eth`).url,
    );
  });
});
