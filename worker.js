import { jwtVerify } from "jose";
import openNextHandler from "./.open-next/worker.js";
import { withLogging } from "./utils/logger";
import { extractClientIp } from "./utils/ip";

const CACHEABLE_API_PATHS = new Set([
  "/avatar",
  "/domain",
  "/ns",
  "/profile",
  "/credential",
  "/search",
  "/wallet",
]);

const TRUSTED_HOST = "web3.bio";
const DEFAULT_SWR = 86400; // 24h
const MIN_ROLE_RESTRICTED = 6;
const PATH_MIN_ROLE = { "/wallet": MIN_ROLE_RESTRICTED };

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

function getBearerToken(value) {
  return value?.startsWith("Bearer ") ? value.slice(7) : value || "";
}

function jsonResponse(status, payload) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function forbidden(message) {
  return jsonResponse(403, { error: "Forbidden", message });
}

async function verifyApiToken(userToken, env) {
  if (!userToken) {
    return null;
  }
  return verifyAuth(getBearerToken(userToken), env);
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

function getCacheKey(url) {
  const cacheUrl = new URL(url);
  cacheUrl.pathname = cacheUrl.pathname.toLowerCase();

  if (cacheUrl.search) {
    const params = new URLSearchParams(cacheUrl.search);
    const sortedParams = new URLSearchParams(
      [...params.entries()].sort((a, b) => a[0].localeCompare(b[0])),
    );
    cacheUrl.search = sortedParams.toString();
  }

  return new Request(cacheUrl.toString(), { method: "GET" });
}

function setCacheHeaders(response, ttl) {
  if (ttl > 0) {
    response.headers.set(
      "Cache-Control",
      `public, max-age=${ttl}, s-maxage=${ttl}, stale-while-revalidate=${DEFAULT_SWR}`,
    );
  }
  response.headers.set("Vary", "Accept-Encoding");
}

function isCacheableResponse(response) {
  const contentLength = response.headers.get("content-length");
  return contentLength !== "0";
}

function getTTL(pathname) {
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
    if (pathname.startsWith(path)) return minRole;
  }
  return null;
}

const handler = {
  async fetch(request, env, ctx) {
    const clientIp = extractClientIp(request);
    const requestWithClientIp = withClientIpHeader(request, clientIp);
    const url = new URL(request.url);
    const pathname = url.pathname;
    const fullPath = pathname + url.search;
    const trustedOrigin = isTrustedOrigin(request);

    // Bypass caching for non-cacheable paths
    if (!isCacheableApiPath(pathname)) {
      return openNextHandler.fetch(requestWithClientIp, env, ctx);
    }

    const userToken = request.headers.get("x-api-key");
    const requiredRole = getRequiredRole(pathname);

    if (requiredRole !== null && !trustedOrigin) {
      if (!userToken) {
        return forbidden("API key required");
      }
      const verifiedToken = await verifyApiToken(userToken, env);
      if (!verifiedToken) {
        return forbidden("Invalid API token");
      }
      const role = Number(verifiedToken.role);
      if (!Number.isFinite(role) || role <= requiredRole) {
        return forbidden("Insufficient permissions");
      }
    } else if (userToken) {
      const verifiedToken = await verifyApiToken(userToken, env);
      if (!verifiedToken) {
        return forbidden("Invalid API token");
      }
    } else if (
      !trustedOrigin &&
      !pathname.startsWith("/avatar/") &&
      env?.API_RATE_LIMIT
    ) {
      // Rate limiting for unauthenticated requests
      const { success } = await env.API_RATE_LIMIT.limit({
        key: clientIp,
      });
      if (!success) {
        return jsonResponse(429, {
          error:
            "429 Too Many Requests. Please refer to the rate limit guidelines at https://api.web3.bio/#authentication.",
        });
      }
    }

    const cacheKey = getCacheKey(url);
    const cached = await caches.default.match(cacheKey);

    // Return cached response if available and valid
    if (cached) {
      const response = new Response(cached.body, {
        status: cached.status,
        statusText: cached.statusText,
        headers: cached.headers,
      });
      response.headers.set("X-CACHE-HIT", "HIT");
      response.headers.set("X-MATCH-PATH", fullPath);
      setCacheHeaders(response, getTTL(pathname));
      return response;
    }

    // Fetch from origin
    const response = await openNextHandler.fetch(requestWithClientIp, env, ctx);
    const ttl = getTTL(pathname);

    response.headers.set("X-CACHE-HIT", "MISS");
    response.headers.set("X-MATCH-PATH", fullPath);
    setCacheHeaders(response, ttl);

    // Cache successful GET responses
    if (response.status === 200 && request.method === "GET") {
      const cacheResponse = response.clone();
      if (isCacheableResponse(cacheResponse)) {
        ctx.waitUntil(
          caches.default
            .put(cacheKey, cacheResponse)
            .catch((err) => console.error("[Cache]", err)),
        );
      }
    }
    return response;
  },
};

export default withLogging(handler);
