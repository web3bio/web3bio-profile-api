import openNextHandler from "./.open-next/worker.js";

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname.startsWith("/icons/")) {
      const asset = await env.ASSETS.fetch(request);
      if (asset.status === 200) {
        const response = new Response(asset.body, asset);
        response.headers.set("Cache-Control", "public, max-age=31536000");
        return response;
      }
    }

    if (!url.pathname.startsWith("/api/")) {
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
        response.headers.set("X-Cache-Hit", "Cache API");
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

      finalResponse.headers.set("X-Cache-Hit", "Miss");
      finalResponse.headers.set("X-MATCH-PATH", url.pathname);
      return finalResponse;
    }

    response.headers.set("X-Cache-Hit", "Miss");
    response.headers.set("X-MATCH-PATH", url.pathname);
    return response;
  },
};
