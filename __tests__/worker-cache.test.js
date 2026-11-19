import { createHash } from "node:crypto";
import { DatabaseSync } from "node:sqlite";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { jwtVerify } from "jose";
import openNextHandler from "../.open-next/worker.js";
import worker from "../worker";
import {
  purgeWorkerCache,
  workerCacheKey,
} from "../utils/cloudflare-cache";

jest.mock("jose", () => ({ ...jest.requireActual("jose"), jwtVerify: jest.fn() }));
jest.mock(
  "../.open-next/worker.js",
  () => ({ __esModule: true, default: { fetch: jest.fn() } }),
  { virtual: true },
);

const migrationDir = join(__dirname, "../migrations");
const migrations = readdirSync(migrationDir).filter(name => name.endsWith(".sql")).sort()
  .map(name => readFileSync(join(migrationDir, name), "utf8")).join("\n");

function localD1(db) {
  return {
    prepare: (sql) => ({
      sql,
      bind: (...args) => ({
        sql, args,
        first: async column => db.prepare(sql).get(...args)?.[column] ?? null,
      }),
    }),
    batch: jest.fn(async (statements) => {
      db.exec("BEGIN");
      try {
        const results = statements.map(({ sql, args = [] }) => {
          const statement = db.prepare(sql);
          if (statement.columns().length) return { results: statement.all(...args) };
          return { results: [], meta: statement.run(...args) };
        });
        db.exec("COMMIT");
        return results;
      } catch (error) {
        db.exec("ROLLBACK");
        throw error;
      }
    }),
  };
}

describe("Worker API", () => {
  const origin = "https://api.web3.bio";
  const solana = "4JBz4tAKgAmxjDPHHi9HRLj14RsCQJyuCkCFKnpz7B9s";
  const originalCaches = Object.getOwnPropertyDescriptor(globalThis, "caches");
  let cache;
  let env;
  let pending;
  let db;
  const paid = { headers: { "x-api-key": "Bearer valid" } };
  const keyId = (token) => createHash("sha256").update(token).digest("hex");
  function topup(token, credits, order = token + "-order") {
    db.prepare("INSERT INTO topups (order_id, key_hash, credits) VALUES (?, ?, ?)")
      .run(order, keyId(token), credits);
  }

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
    db = new DatabaseSync(":memory:");
    db.function("unixepoch", { varargs: true }, () => Date.now() / 1000);
    db.exec(migrations);
    env = {
      JWT_KEY: "test-secret",
      PAID_REQUESTS_PER_10_SECONDS: 50,
      API_RATE_LIMIT: { limit: jest.fn(async () => ({ success: true })) },
      QUOTA_DB: localD1(db),
    };
    topup("valid", 10);
    jwtVerify.mockResolvedValue({ payload: { role: 8 } });
    openNextHandler.fetch.mockImplementation(async () =>
      Response.json(
        [{ identity: "alice.eth", platform: "ens" }],
        { headers: { "x-request-platform": "ens", Vary: "Origin" } },
      ),
    );
  });

  afterEach(() => {
    db.close();
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
    expect(second.headers.get("vary")).toBe("Origin, Accept-Encoding, X-API-Key");
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

  it("reuses restricted data at the edge and keeps the trusted-origin response private downstream", async () => {
    await request("/wallet/alice.eth", paid);
    const trusted = await request("/wallet/alice.eth", { headers: { origin: "https://web3.bio" } });
    expect(trusted.headers.get("X-CACHE-HIT")).toBe("HIT");
    expect(trusted.headers.get("Cache-Control")).toBe("no-store");
    expect(trusted.headers.has("X-Quota-Remaining")).toBe(false);
    expect((await request("/wallet/alice.eth")).status).toBe(403);
  });

  it("locates an issued key by its hash for raw and Bearer headers", async () => {
    const jose = jest.requireActual("jose");
    const token = await new jose.SignJWT({ role: 8 }).setProtectedHeader({ alg: "HS256" })
      .sign(new TextEncoder().encode(env.JWT_KEY));
    jwtVerify.mockImplementation(jose.jwtVerify);
    topup(token, 3);
    for (const header of [token, "Bearer " + token]) {
      expect(await (await request("/quota", { headers: { "x-api-key": header } })).json())
        .toEqual({ remaining: 3 });
    }
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

  it("shares cached data across keys and settles each caller's own balance", async () => {
    const path = "/profile/batch/" + encodeURIComponent(JSON.stringify(["ens,a.eth", "ens,b.eth"]));
    topup("second", 3);
    const first = await request(path, paid);
    const second = await request(path, { headers: { "x-api-key": "second" } });
    const again = await request(path, paid);
    const anonymous = await request(path);
    expect([first, second, again, anonymous].map(r => r.headers.get("X-Quota-Remaining")))
      .toEqual(["9", "2", "8", null]);
    expect(again.headers.get("X-CACHE-HIT")).toBe("HIT");
    expect(again.headers.get("Access-Control-Expose-Headers")).toContain("X-Quota-Remaining");
    expect(again.headers.get("Cache-Control")).toBe("no-store");
    expect((await cache.match(workerCacheKey(origin + path))).headers.has("X-Quota-Remaining")).toBe(false);
    expect(openNextHandler.fetch).toHaveBeenCalledTimes(1);
  });

  it.each([[200, 9], [204, 9], [404, 9], [307, 10], [400, 10], [403, 10], [429, 10], [502, 10]])(
    "settles HTTP %i to a balance of %i", async (status, remaining) => {
      openNextHandler.fetch.mockResolvedValue(new Response(null, { status }));
      const response = await request("/ns/alice.eth", paid);
      expect(response.status).toBe(status);
      expect(response.headers.get("X-Quota-Remaining")).toBe(String(remaining));
      expect(await (await request("/quota", paid)).json()).toEqual({ remaining });
    },
  );

  it("admits overlapping requests on the last credit and downgrades after it is spent", async () => {
    topup("last", 1);
    const init = { headers: { "x-api-key": "last" } };
    const { promise: entered, resolve: started } = Promise.withResolvers();
    const { promise: data, resolve: finish } = Promise.withResolvers();
    openNextHandler.fetch.mockImplementationOnce(() => { started(); return data; });
    const first = request("/wallet/first.eth", init);
    await entered;
    try {
      expect(await (await request("/quota", init)).json()).toEqual({ remaining: 1 });
      const second = await request("/api/wallet/second.eth", init);
      expect(second.status).toBe(200);
      expect(second.headers.get("X-Quota-Remaining")).toBe("0");
      expect((await request("/wallet/third.eth", init)).status).toBe(403);
    } finally {
      finish(Response.json({ wallet: true }));
    }
    const response = await first;
    expect(response.status).toBe(200);
    expect(response.headers.get("X-Quota-Remaining")).toBe("0");
    expect(await (await request("/quota", init)).json()).toEqual({ remaining: 0 });
    const ordinary = await request("/profile/alice.eth", init);
    expect(ordinary.status).toBe(200);
    expect(openNextHandler.fetch.mock.lastCall[0].headers.has("x-api-key")).toBe(false);
  });

  it("shares a rolling 50-call limit with free balance reads, before route permissions", async () => {
    const start = Date.now();
    const clock = jest.spyOn(Date, "now").mockReturnValue(start);
    try {
      for (let i = 0; i < 49; i++) {
        expect(await (await request("/quota", paid)).json()).toEqual({ remaining: 10 });
      }
      jwtVerify.mockResolvedValue({ payload: { role: 1 } });
      const forbidden = await request("/profile/web2/alice.eth", paid);
      expect(forbidden.status).toBe(403);
      expect(forbidden.headers.get("X-Quota-Remaining")).toBe("10");
      clock.mockReturnValue(start + 9999);
      const limited = await request("/wallet/alice.eth", paid);
      expect(limited.status).toBe(429);
      expect(limited.headers.get("Retry-After")).toBe("1");
      expect((await request("/quota", paid)).status).toBe(429);
      topup("second", 2);
      expect(await (await request("/quota", { headers: { "x-api-key": "second" } })).json())
        .toEqual({ remaining: 2 });
      clock.mockReturnValue(start + 10_000);
      expect(await (await request("/quota", paid)).json()).toEqual({ remaining: 10 });
      expect(env.API_RATE_LIMIT.limit).not.toHaveBeenCalled();
      expect(openNextHandler.fetch).not.toHaveBeenCalled();
    } finally {
      clock.mockRestore();
    }
  });

  it("charges a slow response after its rate window has expired", async () => {
    const start = Date.now();
    const clock = jest.spyOn(Date, "now").mockReturnValue(start);
    const { promise: entered, resolve: started } = Promise.withResolvers();
    const { promise: body, resolve: finish } = Promise.withResolvers();
    openNextHandler.fetch.mockImplementationOnce(() => { started(); return body; });
    const slow = request("/wallet/slow.eth", paid);
    try {
      await entered;
      clock.mockReturnValue(start + 70_000);
      expect(await (await request("/quota", paid)).json()).toEqual({ remaining: 10 });
      finish(Response.json({ wallet: true }));
      expect((await slow).headers.get("X-Quota-Remaining")).toBe("9");
    } finally {
      finish();
      clock.mockRestore();
    }
  });

  it("applies the anonymous IP limit to unfunded lookups and funds an existing key by order", async () => {
    const init = { headers: { "x-api-key": "legacy", "cf-connecting-ip": "192.0.2.1" } };
    expect((await request("/quota")).status).toBe(403);
    expect(env.QUOTA_DB.batch).not.toHaveBeenCalled();
    expect(await (await request("/quota", init)).json()).toEqual({ remaining: 0 });
    expect(db.prepare("SELECT count(*) AS n FROM quota_requests").get().n).toBe(0);
    env.API_RATE_LIMIT.limit.mockResolvedValue({ success: false });
    expect((await request("/quota", init)).status).toBe(429);
    expect(env.API_RATE_LIMIT.limit).toHaveBeenLastCalledWith({ key: "192.0.2.1" });
    topup("legacy", 5);
    topup("legacy", 5);
    expect(await (await request("/api/quota", init)).json()).toEqual({ remaining: 5 });
    expect((await request("/api/refresh/ens,alice.eth", init)).headers.get("X-Quota-Remaining")).toBe("4");
    expect(new URL(openNextHandler.fetch.mock.lastCall[0].url).pathname).toBe("/refresh/ens,alice.eth");
    jwtVerify.mockRejectedValueOnce(new Error("expired"));
    expect((await request("/quota", init)).status).toBe(403);
  });

  it("credits identical order retries once and rejects conflicting purchases", () => {
    topup("valid", 4, "new-order");
    topup("valid", 4, "new-order");
    expect(() => topup("other", 4, "new-order")).toThrow("different key or credit amount");
    expect(() => db.prepare("INSERT OR REPLACE INTO topups VALUES (?, ?, ?)")
      .run("new-order", keyId("valid"), 99)).toThrow("different key or credit amount");
    expect(() => db.prepare("INSERT INTO topups VALUES (?, ?, ?)")
      .run("bad-key", "not-a-key-hash", 7)).toThrow("lowercase SHA-256");
    const repeat = db.prepare("INSERT INTO topups VALUES ('new-order', ?, ?)");
    expect(() => repeat.run(null, 4)).toThrow("lowercase SHA-256");
    expect(() => repeat.run(keyId("valid"), null)).toThrow("different key or credit amount");
    expect(() => repeat.run("a".repeat(63) + "\0", 4)).toThrow("lowercase SHA-256");
    expect(db.prepare("SELECT remaining FROM api_keys WHERE key_hash = ?").get(keyId("valid")).remaining).toBe(14);
    expect(db.prepare("SELECT remaining FROM api_keys WHERE key_hash = ?").get(keyId("other"))).toBeUndefined();
  });

  it("charges route-level 404s in the API namespace once", async () => {
    openNextHandler.fetch.mockResolvedValue(new Response(null, { status: 404 }));
    const response = await request("/api/unknown/endpoint", paid);
    expect(response.status).toBe(404);
    expect(response.headers.get("X-Quota-Remaining")).toBe("9");
    expect(new URL(openNextHandler.fetch.mock.lastCall[0].url).pathname).toBe("/api/unknown/endpoint");
  });

  it("meters keyed HEAD and 204 responses and keeps public assets outside billing", async () => {
    expect((await request("/llms.txt", paid)).headers.has("X-Quota-Remaining")).toBe(false);
    expect(env.QUOTA_DB.batch).not.toHaveBeenCalled();
    openNextHandler.fetch.mockResolvedValue(new Response(null, { status: 200 }));
    const head = await request("/profile/alice.eth", { ...paid, method: "HEAD" });
    expect(head.headers.get("X-Quota-Remaining")).toBe("9");
    const options = await request("/profile/alice.eth", { ...paid, method: "OPTIONS" });
    expect(options.status).toBe(204);
    expect(options.headers.get("X-Quota-Remaining")).toBe("8");
  });

  it("preserves POST batches and strips the customer key after its last credit", async () => {
    topup("batch", 1);
    const body = { queryIds: ["ens,a.eth", "ens,b.eth"] };
    openNextHandler.fetch.mockImplementation(async (req) => Response.json({
      body: await req.json(), key: req.headers.get("x-api-key"),
    }));
    const init = {
      method: "POST", body: JSON.stringify(body),
      headers: { "Content-Type": "application/json", "x-api-key": "batch" },
    };
    const paidBatch = await request("/api/socialgraph/identities", init);
    expect(await paidBatch.json()).toEqual({ body, key: "batch" });
    expect(paidBatch.headers.get("X-Quota-Remaining")).toBe("0");
    const ordinaryBatch = await request("/socialgraph/identities", init);
    expect(await ordinaryBatch.json()).toEqual({ body, key: null });
    expect(cache.put).not.toHaveBeenCalled();
  });

  it("skips charging upstream failures and fails closed when D1 admission is unavailable", async () => {
    const log = jest.spyOn(console, "error").mockImplementation(() => {});
    try {
      openNextHandler.fetch.mockRejectedValueOnce(new Error("upstream unavailable"));
      expect((await request("/domain/other.eth", paid)).status).toBe(503);
      expect(await (await request("/quota", paid)).json()).toEqual({ remaining: 10 });
      env.QUOTA_DB.batch.mockImplementationOnce(() => { throw new Error("unavailable"); });
      expect((await request("/wallet/alice.eth", paid)).status).toBe(503);
      expect(openNextHandler.fetch).toHaveBeenCalledTimes(1);
    } finally {
      log.mockRestore();
    }
  });

  it.each([200, 404])("recovers a committed %i when D1 loses the debit acknowledgement", async (status) => {
    const batch = env.QUOTA_DB.batch.getMockImplementation();
    env.QUOTA_DB.batch.mockImplementationOnce(batch).mockImplementationOnce(async statements => {
      await batch(statements);
      throw new Error("lost acknowledgement");
    });
    openNextHandler.fetch.mockResolvedValue(new Response("data", { status }));
    const response = await request("/profile/alice.eth", paid);
    expect(response.status).toBe(status);
    expect(response.headers.get("X-Quota-Remaining")).toBe("9");
    expect(await response.text()).toBe("data");
    expect(await (await request("/quota", paid)).json()).toEqual({ remaining: 9 });
  });

  it("prevents a late write from charging a failed response", async () => {
    const batch = env.QUOTA_DB.batch.getMockImplementation();
    let late;
    env.QUOTA_DB.batch.mockImplementationOnce(batch).mockImplementationOnce(async statements => {
      late = statements;
      throw new Error("write timed out");
    });
    const log = jest.spyOn(console, "error").mockImplementation(() => {});
    try {
      expect((await request("/profile/alice.eth", paid)).status).toBe(503);
      await batch(late);
      expect(await (await request("/quota", paid)).json()).toEqual({ remaining: 10 });
    } finally {
      log.mockRestore();
    }
  });

  it.each(["disconnected", "expired", "before submission"])("withholds paid data when settlement fails: %s", async reason => {
    const batch = env.QUOTA_DB.batch.getMockImplementation();
    const start = Date.now();
    const clock = jest.spyOn(Date, "now").mockReturnValue(start);
    const log = jest.spyOn(console, "error").mockImplementation(() => {});
    env.QUOTA_DB.batch.mockImplementationOnce(batch).mockImplementationOnce(async statements => {
      if (reason !== "before submission") await batch(statements);
      if (reason === "expired") {
        clock.mockReturnValue(start + 61_000);
        await request("/quota", paid);
      }
      throw new Error("lost acknowledgement");
    });
    if (reason !== "expired") env.QUOTA_DB.batch.mockRejectedValueOnce(new Error("offline"));
    try {
      await expect(request("/profile/alice.eth", paid)).rejects.toThrow(
        reason === "expired" ? "lost acknowledgement" : "offline",
      );
      expect(await (await request("/quota", paid)).json()).toEqual({
        remaining: reason === "before submission" ? 10 : 9,
      });
    } finally {
      log.mockRestore();
      clock.mockRestore();
    }
  });

  it("reports the current balance on a non-billable response after a concurrent charge", async () => {
    const { promise: entered, resolve: started } = Promise.withResolvers();
    const { promise: data, resolve: finish } = Promise.withResolvers();
    openNextHandler.fetch.mockImplementationOnce(() => { started(); return data; });
    const slow = request("/wallet/slow.eth", paid);
    await entered;
    try {
      expect((await request("/wallet/other.eth", paid)).headers.get("X-Quota-Remaining")).toBe("9");
    } finally {
      finish(new Response(null, { status: 502 }));
    }
    const response = await slow;
    expect(response.status).toBe(502);
    expect(response.headers.get("X-Quota-Remaining")).toBe("9");
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
