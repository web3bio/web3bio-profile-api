import { jwtVerify } from "jose";
import openNextHandler from "./.open-next/worker.js";
import { withLogging } from "./utils/logger.js";
import { getClientIP } from "./utils/utils.js";

const CACHEABLE_API_PATHS = [
  "/avatar/",
  "/domain/",
  "/ns/",
  "/profile/",
  "/credential/",
];

const TRUSTED_HOST = "web3.bio";
const DEFAULT_SWR = 86400; // 24h

function isCacheableApiPath(pathname) {
  return CACHEABLE_API_PATHS.some((path) => pathname.startsWith(path));
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

function getCacheKey(url) {
  const cacheUrl = new URL(url);
  cacheUrl.search = "";
  cacheUrl.pathname = cacheUrl.pathname.toLowerCase();
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

function getTTL(pathname) {
  if (pathname.startsWith("/avatar/svg/")) return 2592000; // 30d
  if (pathname.startsWith("/avatar/")) return 86400; // 24h
  if (pathname.startsWith("/domain/")) return 900; // 15m
  return 7200; // 2h
}

const handler = {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const pathname = url.pathname;

    // Bypass caching for non-cacheable paths
    if (!isCacheableApiPath(pathname)) {
      return openNextHandler.fetch(request, env, ctx);
    }

    // Verify API key
    const userToken = request.headers.get("x-api-key");
    if (userToken) {
      const verifiedToken = await verifyAuth(
        userToken.replace("Bearer ", ""),
        env,
      );

      if (!verifiedToken) {
        return new Response(JSON.stringify({ error: "Invalid API Token" }), {
          status: 403,
          headers: { "Content-Type": "application/json" },
        });
      }
    } else if (
      !isTrustedOrigin(request) &&
      !pathname.startsWith("/avatar/") &&
      env?.API_RATE_LIMIT
    ) {
      // Rate limiting for unauthenticated requests
      const { success } = await env.API_RATE_LIMIT.limit({
        key: getClientIP(request),
      });
      if (!success) {
        return new Response(
          JSON.stringify({
            error:
              "429 Too Many Requests. Please refer to the rate limit guidelines at https://api.web3.bio/#authentication.",
          }),
          { status: 429, headers: { "Content-Type": "application/json" } },
        );
      }
    }

    const cacheKey = getCacheKey(url);
    const cached = await caches.default.match(cacheKey);

    // Return cached response if available and valid
    if (cached) {
      const cachedBody = await cached.text();
      if (cachedBody?.trim()) {
        const response = new Response(cachedBody, {
          status: cached.status,
          statusText: cached.statusText,
          headers: cached.headers,
        });
        response.headers.set("X-CACHE-HIT", "HIT");
        response.headers.set("X-MATCH-PATH", pathname);
        setCacheHeaders(response, getTTL(pathname));
        return response;
      }
      ctx.waitUntil(caches.default.delete(cacheKey));
    }

    // Fetch from origin
    const response = await openNextHandler.fetch(request, env, ctx);
    const ttl = getTTL(pathname);

    response.headers.set("X-CACHE-HIT", "MISS");
    response.headers.set("X-MATCH-PATH", pathname);
    setCacheHeaders(response, ttl);

    // Cache successful GET responses
    if (response.status === 200 && request.method === "GET") {
      const bodyText = await response.text();
      if (bodyText?.trim()) {
        const cacheResponse = new Response(bodyText, {
          status: response.status,
          statusText: response.statusText,
          headers: response.headers,
        });
        ctx.waitUntil(
          caches.default
            .put(cacheKey, cacheResponse)
            .catch((err) => console.error("[Cache]", err)),
        );
        return new Response(bodyText, response);
      }
    }
    return response;
  },
};

export default withLogging(handler);
