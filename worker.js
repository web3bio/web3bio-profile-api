import { jwtVerify } from "jose";
import openNextHandler from "./.open-next/worker.js";
import { withLogging } from "./utils/logger.js";

const CACHEABLE_API_PATHS = [
  "/avatar/",
  "/domain/",
  "/ns/",
  "/profile/",
  "/credential/",
];

const TRUSTED_DOMAINS = ["https://web3.bio", "https://staging.web3.bio"];

function isCacheableApiPath(pathname) {
  return CACHEABLE_API_PATHS.some((path) => pathname.startsWith(path));
}

function isTrustedOrigin(request) {
  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");
  const secFetchSite = request.headers.get("sec-fetch-site");

  if (!secFetchSite) {
    return false;
  }

  if (secFetchSite !== "same-site" && secFetchSite !== "same-origin") {
    return false;
  }

  const isFromTrusted = TRUSTED_DOMAINS.some(
    (domain) => origin?.startsWith(domain) || referer?.startsWith(domain),
  );

  if (!isFromTrusted) {
    return false;
  }

  return true;
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

const handler = {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const pathname = url.pathname;
    // Bypass caching for non-cacheable paths
    if (
      pathname.startsWith("/_next/") ||
      pathname.startsWith("/icons/") ||
      !isCacheableApiPath(pathname)
    ) {
      return openNextHandler.fetch(request, env, ctx);
    }

    // Verify API key
    const userToken = request.headers.get("x-api-key");
    let isValidApiKey = false;

    if (userToken) {
      const verifiedToken = await verifyAuth(
        userToken.replace("Bearer ", ""),
        env,
      );

      if (verifiedToken) {
        // Valid API key, skip rate limiting
        isValidApiKey = true;
      } else {
        // Invalid API key
        return new Response(
          JSON.stringify({
            address: null,
            identity: null,
            platform: null,
            error: "Invalid API Token",
          }),
          { status: 403 },
        );
      }
    }

    // Rate limiting for unauthenticated or invalid API key
    if (!isValidApiKey && !isTrustedOrigin(request)) {
      const clientIP = request.headers.get("cf-connecting-ip") || "unknown";
      if (env && env.API_RATE_LIMIT) {
        const { success } = await env.API_RATE_LIMIT.limit({ key: clientIP });
        if (!success) {
          return new Response(
            JSON.stringify({
              address: null,
              identity: null,
              platform: null,
              error: "429 Too Many Requests",
            }),
            { status: 429 },
          );
        }
      }
    }

    // Bypass cache if no-cache requested
    if (
      request.headers.get("cache-control") === "no-cache" ||
      url.searchParams.has("nocache")
    ) {
      const response = await openNextHandler.fetch(request, env, ctx);
      response.headers.set("X-MATCH-PATH", pathname);
      return response;
    }

    const cacheKey = new Request(url.toString());
    const cached = await caches.default.match(cacheKey);

    // Return cached response if available
    if (cached) {
      const cachedBody = await cached.clone().text();
      if (cachedBody?.trim()) {
        const response = new Response(cachedBody, cached);
        response.headers.set("X-CACHE-HIT", "HIT");
        response.headers.set("X-MATCH-PATH", pathname);
        return response;
      }
      ctx.waitUntil(caches.default.delete(cacheKey));
    }

    // Fetch from origin
    const response = await openNextHandler.fetch(request, env, ctx);
    const bodyText = await response.clone().text();

    if (
      response.status === 200 &&
      request.method === "GET" &&
      bodyText?.trim()
    ) {
      const finalResponse = new Response(bodyText, response);

      // Cache successful GET responses
      ctx.waitUntil(
        caches.default
          .put(cacheKey, finalResponse.clone())
          .catch((err) => console.error("[Cache]", err)),
      );

      finalResponse.headers.set("X-CACHE-HIT", "MISS");
      finalResponse.headers.set("X-MATCH-PATH", pathname);
      return finalResponse;
    }

    response.headers.set("X-CACHE-HIT", "MISS");
    response.headers.set("X-MATCH-PATH", pathname);
    return response;
  },
};

export default withLogging(handler);
