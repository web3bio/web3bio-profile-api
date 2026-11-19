import { base64url, jwtVerify } from "jose";
import { createHash } from "node:crypto";
import openNextHandler from "./.open-next/worker.js";
import { withLogging } from "./utils/logger";
import { extractClientIp } from "./utils/ip";
import { workerCacheKey } from "./utils/cloudflare-cache";
import { admitKey, chargeKey } from "./quota";

const CACHEABLE_API_PATHS = new Set([
  "/avatar",
  "/domain",
  "/ns",
  "/profile",
  "/credential",
  "/badge",
  "/search",
  "/socialgraph",
  "/wallet",
  "/partner",
  "/refresh",
]);

const TRUSTED_HOST = "web3.bio";
const STATIC_PATHS = new Set([
  "/favicon.ico", "/favicon.svg", "/robots.txt", "/llms.txt", "/opengraph-image.jpg",
]);
const DEFAULT_SWR = 86400; // 24h
const MIN_ROLE_RESTRICTED = 6;
const PATH_MIN_ROLE = {
  "/wallet": MIN_ROLE_RESTRICTED,
};
const RATE_LIMIT_ERROR =
  "429 Too Many Requests. Please refer to the rate limit guidelines at https://api.web3.bio/#api-key.";
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS, HEAD",
  "Access-Control-Allow-Headers": "Content-Type, X-Api-Key",
  "Access-Control-Expose-Headers": "Retry-After, X-Request-Platform, X-Quota-Remaining",
};

function isCacheableApiPath(pathname) {
  const secondSlash = pathname.indexOf("/", 1);
  const topLevelPath =
    secondSlash === -1 ? pathname : pathname.slice(0, secondSlash);
  return CACHEABLE_API_PATHS.has(topLevelPath);
}

function isHostTrusted(host) {
  if (!host) return false;
  return host === TRUSTED_HOST || host.endsWith(`.${TRUSTED_HOST}`);
}

function isTrustedOrigin(request) {
  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");

  if (!origin && !referer) return false;

  try {
    const originHost = origin ? new URL(origin).host : null;
    const refererHost = referer ? new URL(referer).host : null;
    return isHostTrusted(originHost) || isHostTrusted(refererHost);
  } catch {
    return false;
  }
}

async function verifyAuth(token, env) {
  if (!env.JWT_KEY) return null;
  try {
    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(env.JWT_KEY),
    );
    return payload;
  } catch {
    return null;
  }
}

function jsonResponse(status, payload, extraHeaders = {}) {
  return Response.json(payload, {
    status,
    headers: { ...CORS_HEADERS, "Cache-Control": "no-store", ...extraHeaders },
  });
}

function forbidden(message) {
  return jsonResponse(403, { error: "Forbidden", message });
}

function rateLimited(retryAfter = 10) {
  return jsonResponse(429, { error: RATE_LIMIT_ERROR }, { "Retry-After": String(retryAfter) });
}

async function allowAnonymous(env, key) {
  return !env.API_RATE_LIMIT || (await env.API_RATE_LIMIT.limit({ key })).success;
}

function withClientIpHeader(request, clientIp) {
  if (!clientIp || clientIp === "unknown") {
    return request;
  }
  const existing = request.headers.get("x-client-ip");
  if (existing === clientIp) {
    return request;
  }

  const headers = new Headers(request.headers);
  headers.set("x-client-ip", clientIp);
  return new Request(request, { headers });
}

function varyBy(headers, name) {
  const fields = (headers.get("Vary") || "").toLowerCase().split(/\s*,\s*/);
  if (!fields.includes("*") && !fields.includes(name.toLowerCase())) headers.append("Vary", name);
}

function setCacheHeaders(response, ttl) {
  if (ttl > 0) {
    response.headers.set(
      "Cache-Control",
      `public, max-age=${ttl}, s-maxage=${ttl}, stale-while-revalidate=${DEFAULT_SWR}`,
    );
  }
  varyBy(response.headers, "Accept-Encoding");
}

function isCacheableResponse(response, pathname) {
  if (
    /(?:^|,)\s*(?:private|no-store|no-cache)(?:\s*(?:=|,|$))/i.test(
      response.headers.get("Cache-Control") || "",
    ) ||
    response.headers.has("Set-Cookie") ||
    response.headers.get("Vary") === "*"
  ) {
    return false;
  }

  return (
    (response.status === 200 && response.headers.get("content-length") !== "0") ||
    (pathname.startsWith("/avatar/") &&
      response.status === 307 &&
      response.headers.has("Location"))
  );
}

function getTTL(pathname) {
  if (pathname.startsWith("/socialgraph/")) return 2592000;
  if (pathname.startsWith("/avatar/svg/")) return 2592000; // 30d
  if (pathname.startsWith("/avatar/")) return 86400; // 24h
  if (pathname.startsWith("/domain/")) return 900; // 15m
  return 7200; // 2h
}

function getRequiredRole(pathname) {
  if (/^\/profile\/web2\/[^/]+$/.test(pathname)) {
    return MIN_ROLE_RESTRICTED;
  }
  for (const [path, minRole] of Object.entries(PATH_MIN_ROLE)) {
    if (pathname === path || pathname.startsWith(path + "/")) return minRole;
  }
  return null;
}

function withCacheMetadata(response, cacheHit, fullPath, ttl) {
  response.headers.set("X-CACHE-HIT", cacheHit);
  response.headers.set("X-MATCH-PATH", fullPath);
  setCacheHeaders(response, ttl);
  return response;
}

function isRefreshPath(pathname) {
  return pathname === "/refresh" || pathname.startsWith("/refresh/");
}

function responseWithNoStore(response) {
  const headers = new Headers(response.headers);
  headers.set("Cache-Control", "no-store");
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

function preflight() {
  return new Response(null, {
    status: 204,
    headers: { ...CORS_HEADERS, "Cache-Control": "no-store" },
  });
}

function clientResponse(response, remaining, restricted = false) {
  // The cache stores the data response before we add the caller's balance.
  const result = new Response(response.body, response);
  if (remaining == null) result.headers.delete("X-Quota-Remaining");
  else result.headers.set("X-Quota-Remaining", String(remaining));
  if (remaining !== undefined) {
    result.headers.set("Access-Control-Expose-Headers", CORS_HEADERS["Access-Control-Expose-Headers"]);
  }
  if (remaining !== undefined || restricted) {
    result.headers.set("Cache-Control", "no-store");
  } else {
    varyBy(result.headers, "X-API-Key");
  }
  return result;
}

async function serveData(request, env, ctx, pathname, claims) {
  if (request.method === "OPTIONS") return preflight();
  // The single-handle discovery route passes straight through to OpenNext.
  if (!isCacheableApiPath(pathname)) return openNextHandler.fetch(request, env, ctx);

  const trustedOrigin = isTrustedOrigin(request);
  const requiredRole = getRequiredRole(pathname);
  if (isRefreshPath(pathname)) {
    if (!claims) return forbidden("API key required");
  } else if (requiredRole !== null && !trustedOrigin) {
    if (!claims) return forbidden("API key required");
    const role = Number(claims.role);
    if (!Number.isFinite(role) || role <= requiredRole) {
      return forbidden("Insufficient permissions");
    }
  } else if (!claims && !trustedOrigin && !pathname.startsWith("/avatar/")) {
    if (!(await allowAnonymous(env, extractClientIp(request)))) return rateLimited();
  }

  if (isRefreshPath(pathname) || !["GET", "HEAD"].includes(request.method)) {
    return responseWithNoStore(await openNextHandler.fetch(request, env, ctx));
  }

  const url = new URL(request.url);
  const fullPath = url.pathname + url.search;
  const cacheKey = workerCacheKey(url);
  let cached = null;
  try {
    cached = await caches.default.match(cacheKey);
  } catch (err) {
    console.error("[Cache]", err);
  }

  // Return cached response if available and valid
  if (cached) {
    return withCacheMetadata(
      new Response(request.method === "HEAD" ? null : cached.body, {
        status: cached.status,
        statusText: cached.statusText,
        headers: cached.headers,
      }),
      "HIT",
      fullPath,
      getTTL(pathname),
    );
  }

  // Fetch from origin
  let response = await openNextHandler.fetch(request, env, ctx);

  if (!isCacheableResponse(response, pathname)) {
    return withCacheMetadata(responseWithNoStore(response), "MISS", fullPath, 0);
  }

  response = new Response(response.body, response);
  const ttl = getTTL(pathname);
  withCacheMetadata(response, "MISS", fullPath, ttl);

  if (request.method === "GET") {
    const cacheResponse = response.clone();
    ctx.waitUntil(
      caches.default
        .put(cacheKey, cacheResponse)
        .catch((err) => console.error("[Cache]", err)),
    );
  }
  return response;
}

// Match the public route and its native Next.js /api alias using the same policy.
function policyPath(pathname) {
  try {
    pathname = decodeURI(pathname);
  } catch { /* The route handler will report malformed identities. */ }
  return pathname.toLowerCase().replace(/^\/api(?=\/)/, "").replace(/\/+$/, "");
}

function unavailable() {
  return jsonResponse(503, { error: "Service unavailable" });
}

const handler = {
  async fetch(request, env, ctx) {
    const clientIp = extractClientIp(request);
    request = withClientIpHeader(request, clientIp);
    const url = new URL(request.url);
    const path = policyPath(url.pathname);
    const balanceOnly = path === "/quota";
    const discovery = /^\/[^/]+$/.test(path) && path !== "/api" && !STATIC_PATHS.has(path);
    const knownRoute = balanceOnly || discovery || isCacheableApiPath(path);
    const nativeApi = /^\/api\/.+/i.test(url.pathname);
    if (!knownRoute && !nativeApi) {
      return openNextHandler.fetch(request, env, ctx);
    }
    if (nativeApi && knownRoute) {
      url.pathname = url.pathname.slice(4);
      request = new Request(url, request);
    }

    const suppliedKey = request.headers.get("x-api-key");
    if (request.method === "OPTIONS" && (suppliedKey === null || balanceOnly)) return preflight();
    if (balanceOnly && request.method !== "GET") {
      return jsonResponse(405, { error: "Method not allowed" }, { Allow: "GET, OPTIONS" });
    }
    if (suppliedKey === null) {
      if (balanceOnly) {
        return await allowAnonymous(env, clientIp) ? forbidden("API key required") : rateLimited();
      }
      const response = await serveData(request, env, ctx, path, null);
      return clientResponse(response, undefined, getRequiredRole(path) !== null);
    }

    const token = suppliedKey.replace(/^Bearer /, "");
    const claims = await verifyAuth(token, env);
    if (!claims) return forbidden("Invalid API token");

    // The signature bytes identify the same issued key across accepted base64url spellings.
    const canonicalToken = token.replace(/\.([^.]+)$/, (_, signature) =>
      "." + base64url.encode(base64url.decode(signature)));
    const keyHash = createHash("sha256").update(canonicalToken).digest("hex");
    const db = env.QUOTA_DB;
    let admission;
    let response;
    try {
      admission = await admitKey(db, keyHash, env.PAID_REQUESTS_PER_10_SECONDS);
      const { remaining, retryAfter } = admission;
      if (retryAfter) return clientResponse(rateLimited(retryAfter), remaining);
      if (balanceOnly) {
        const limited = !remaining && !(await allowAnonymous(env, clientIp));
        return clientResponse(limited ? rateLimited() : jsonResponse(200, { remaining }), remaining);
      }
      if (!remaining) {
        const headers = new Headers(request.headers);
        headers.delete("x-api-key");
        const anonymous = await serveData(new Request(request, { headers }), env, ctx, path, null);
        return clientResponse(anonymous, 0);
      }

      response = await serveData(request, env, ctx, path, claims);
    } catch (error) {
      console.error("[Worker]", error);
      return unavailable();
    }
    if (!response.ok && response.status !== 404) {
      try {
        const remaining = await db.prepare("SELECT remaining FROM api_keys WHERE key_hash = ?")
          .bind(keyHash).first("remaining");
        return clientResponse(response, remaining ?? 0);
      } catch (error) {
        console.error("[Quota]", error);
        return clientResponse(response, null);
      }
    }
    const balance = await chargeKey(db, keyHash, admission.requestId);
    return balance === null ? unavailable() : clientResponse(response, balance);
  },
};

export default withLogging(handler);
