import openNextHandler from "./.open-next/worker.js";

const CACHE_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days

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

    const isPumpfun = url.pathname.startsWith("/api/pumpfun");
    const cacheKey = new Request(url.toString());
    const kvKey = `kv-cache:${url.pathname}${url.search}`;

    if (isPumpfun) {
      const kvData = await env.KV_CACHE?.get(kvKey, "json").catch(() => null);
      if (
        kvData &&
        Date.now() - kvData.updatedAt <= CACHE_TTL &&
        kvData.body?.trim()
      ) {
        return new Response(kvData.body, {
          status: 200,
          headers: {
            ...kvData.headers,
            "X-Cache-Hit": "KV",
            "X-Cache-Age": Math.floor(
              (Date.now() - kvData.updatedAt) / 1000,
            ).toString(),
            "X-MATCH-PATH": url.pathname,
          },
        });
      }
    }

    const cached = await caches.default.match(cacheKey);
    if (cached) {
      const cachedBody = await cached.clone().text();
      if (cachedBody?.trim()) {
        if (isPumpfun) {
          ctx.waitUntil(
            updateKV(env.KV_CACHE, kvKey, cachedBody, cached.headers),
          );
        }
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

      const cachePromises = [
        caches.default.put(cacheKey, finalResponse.clone()),
      ];
      if (isPumpfun) {
        cachePromises.push(
          updateKV(env.KV_CACHE, kvKey, bodyText, response.headers),
        );
      }

      ctx.waitUntil(
        Promise.all(cachePromises).catch((err) =>
          console.error("[Cache]", err),
        ),
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

async function updateKV(kv, key, bodyText, headers) {
  if (!kv || !bodyText?.trim()) return;
  try {
    const savedHeaders = {};
    [
      "content-type",
      "content-encoding",
      "cache-control",
      "etag",
      "last-modified",
    ].forEach((h) => {
      const value = headers.get(h);
      if (value) savedHeaders[h] = value;
    });
    await kv.put(
      key,
      JSON.stringify({
        body: bodyText,
        headers: savedHeaders,
        updatedAt: Date.now(),
      }),
      { expirationTtl: 2 * 24 * 60 * 60 },
    );
  } catch (error) {
    console.error("[KV]", error);
  }
}
