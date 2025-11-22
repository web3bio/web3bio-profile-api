import openNextHandler from "./.open-next/worker.js";

const CACHEABLE_API_PATHS = [
  "/avatar/",
  "/domain/",
  "/ns/",
  "/profile/",
  "/credential/",
];

function isCacheableApiPath(pathname) {
  // Exclude webp process from caching
  if (pathname.startsWith("/avatar/process")) {
    return false;
  }
  return CACHEABLE_API_PATHS.some((path) => pathname.startsWith(path));
}

const workerConfig = {
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
      const response = cached.clone();
      response.headers.set("X-CACHE-HIT", "HIT");
      response.headers.set("X-MATCH-PATH", pathname);
      return response;
    }

    // Fetch from origin
    const response = await openNextHandler.fetch(request, env, ctx);

    // Cache successful GET responses
    if (response.status === 200 && request.method === "GET") {
      ctx.waitUntil(
        caches.default
          .put(cacheKey, response.clone())
          .catch((err) => console.error("[Cache]", err)),
      );
    }

    response.headers.set("X-CACHE-HIT", "MISS");
    response.headers.set("X-MATCH-PATH", pathname);
    return response;
  },
};

export default workerConfig;
