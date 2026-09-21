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

  it.each([
    ["/profile/Alice.ETH", "/profile/alice.eth"],
    ["/profile/ens/Alice.ETH", "/profile/ens/alice.eth"],
    ["/profile/ens%2CAlice.ETH", "/profile/ens,alice.eth"],
    [
      "/ns/0xAbCd000000000000000000000000000000000000",
      "/ns/0xabcd000000000000000000000000000000000000",
    ],
    ["/search?platform=ens&identity=Alice.ETH", "/search?identity=alice.eth&platform=ens"],
    ["/search/suggest/Alice", "/search/suggest/alice"],
  ])("normalizes case-insensitive identities in %s", (first, second) => {
    expect(workerCacheKey(first, origin).url).toBe(workerCacheKey(second, origin).url);
  });

  it.each([
    (id) => `/profile/${id}`,
    (id) => `/profile/solana/${id}`,
    (id) => `/profile/solana,${id}`,
    (id) => `/profile/solana%2C${id}`,
    (id) => `/search?platform=solana&identity=${id}`,
  ])("preserves exempt identity case across route formats", (path) => {
    const key = workerCacheKey(path(solana), origin).url;
    expect(key).toContain(solana);
    expect(key).not.toBe(workerCacheKey(path(solana.toLowerCase()), origin).url);
  });

  it.each(["/profile/batch/", "/ns/batch/", "/ns/batch/universal/"])(
    "normalizes each identity in %s without changing order or duplicates",
    (prefix) => {
      const key = (ids) => workerCacheKey(
        prefix + encodeURIComponent(JSON.stringify(ids)), origin,
      ).url;
      const ids = ["ens,Alice.ETH", `solana,${solana}`, "ens,Alice.ETH"];
      expect(key(ids)).toBe(key(["ens,alice.eth", `solana,${solana}`, "ens,alice.eth"]));
      expect(key(ids)).not.toBe(key([...ids].reverse().slice(1)));
      expect(key(ids)).not.toBe(key([ids[1], ids[0], ids[2]]));
      expect(key(ids)).not.toBe(key(ids.map((id) => id.toLowerCase())));
    },
  );

  it("does not normalize route prefixes or unrelated query values", () => {
    expect(workerCacheKey("/Profile/ens/Alice.ETH?token=AbCd", origin).url).toBe(
      `${origin}/Profile/ens/alice.eth?token=AbCd`,
    );
    expect(workerCacheKey("/profile/%ZZ", origin).url).toBe(`${origin}/profile/%ZZ`);
  });

  it("shares cache entries across equivalent identity casing and purges them", async () => {
    const first = await request("/profile/ens/Alice.ETH");
    const second = await request("/profile/ens/alice.eth");
    expect(second.headers.get("x-cache-hit")).toBe("HIT");
    expect(await second.json()).toEqual(await first.json());
    await purgeWorkerCache("ens", "ALICE.ETH", origin);
    expect((await request("/profile/ens/alice.eth")).headers.get("x-cache-hit")).toBe("MISS");
    expect(openNextHandler.fetch).toHaveBeenCalledTimes(2);
  });
});
