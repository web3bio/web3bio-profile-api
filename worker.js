import openNextHandler from "./.open-next/worker.js";

const CACHEABLE_PATHS = [
  "/avatar/",
  "/domain/",
  "/ns/",
  "/profile/",
  "/credentials/",
];

const STATIC_ASSET_PATTERNS = [
  /^\/_next\/static\//,
  /^\/icons\//,
  /\.(css|js|woff2?|ttf|eot|svg|png|jpg|jpeg|gif|webp|ico)$/i,
];

function isStaticAsset(pathname) {
  return STATIC_ASSET_PATTERNS.some((pattern) => pattern.test(pathname));
}

function isCacheablePath(pathname) {
  return CACHEABLE_PATHS.some((path) => pathname.startsWith(path));
}

const workerConfig = {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (isStaticAsset(url.pathname)) {
      const asset = await env.ASSETS.fetch(request);
      if (asset.status === 200) {
        const response = new Response(asset.body, asset);
        response.headers.set(
          "Cache-Control",
          "public, max-age=31536000, immutable",
        );
        return response;
      }
      return openNextHandler.fetch(request, env, ctx);
    }

    if (!isCacheablePath(url.pathname)) {
      return openNextHandler.fetch(request, env, ctx);
    }

    if (
      request.headers.get("cache-control") === "no-cache" ||
      url.searchParams.has("nocache")
    ) {
      const response = await openNextHandler.fetch(request, env, ctx);
      response.headers.set("X-MATCH-PATH", url.pathname);
      return response;
    }

    const cacheKey = new Request(url.toString());

    const cached = await caches.default.match(cacheKey);
    if (cached) {
      const cachedBody = await cached.clone().text();
      if (cachedBody?.trim()) {
        const response = new Response(cachedBody, cached);
        response.headers.set("X-CACHE-HIT", "HIT");
        response.headers.set("X-MATCH-PATH", url.pathname);
        return response;
      }
      ctx.waitUntil(caches.default.delete(cacheKey));
    }

    const response = await openNextHandler.fetch(request, env, ctx);
    const bodyText = await response.clone().text();

    if (
      response.status === 200 &&
      request.method === "GET" &&
      bodyText?.trim()
    ) {
      const finalResponse = new Response(bodyText, response);

      ctx.waitUntil(
        caches.default
          .put(cacheKey, finalResponse.clone())
          .catch((err) => console.error("[Cache]", err)),
      );

      finalResponse.headers.set("X-CACHE-HIT", "MISS");
      finalResponse.headers.set("X-MATCH-PATH", url.pathname);
      return finalResponse;
    }

    response.headers.set("X-CACHE-HIT", "MISS");
    response.headers.set("X-MATCH-PATH", url.pathname);
    return response;
  },
};

export default workerConfig;
