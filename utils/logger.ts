const AXIOM_INGEST_URL = "https://api.axiom.co/v1/datasets";

const getApiKey = (headerValue: string): string => {
  const key = headerValue.replace("Bearer ", "");
  return key.includes(".") ? key.split(".").pop()! : key;
};

const getIp = (request: Request): string => {
  return (
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-forwarded-for") ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
};

export const withLogging = (handler: any) => {
  return {
    async fetch(request: Request, env: any, ctx: any) {
      const url = new URL(request.url);
      const startTime = Date.now();
      const response = await handler.fetch(request, env, ctx);
      const pathname = url.pathname;

      if (env.AXIOM_DATASET && env.AXIOM_API_TOKEN) {
        const pathParts = pathname.split("/").filter(Boolean);
        const duration = Date.now() - startTime;
        const status = response.status;

        const logData = {
          _time: new Date(startTime).toISOString(),
          method: request.method,
          path: pathname,
          query: url.search || "none",
          endpoint: pathParts.slice(0, -1).join("/") || "unknown",
          identity: pathParts[pathParts.length - 1] || "unknown",
          status,
          host: request.headers.get("host") || "unknown",
          origin: request.headers.get("origin") || "none",
          referer: request.headers.get("referer") || "none",
          success: response.ok,
          duration_ms: duration,
          user_agent: request.headers.get("user-agent") || "unknown",
          content_type: request.headers.get("content-type") || "none",
          api_key: getApiKey(request.headers.get("x-api-key") || "none"),
          ip: getIp(request),
          country: (request as any).cf?.country || "unknown",
          city: (request as any).cf?.city || "unknown",
          cache_hit: response.headers.get("X-CACHE-HIT") || "none",
          cache_age: response.headers.get("X-Cache-Age") || "0",
          content_length: response.headers.get("content-length") || "0",
          level: status >= 500 ? "error" : status >= 400 ? "warn" : "info",
        };

        ctx.waitUntil(
          fetch(`${AXIOM_INGEST_URL}/${env.AXIOM_DATASET}/ingest`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${env.AXIOM_API_TOKEN}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify([logData]),
          }).catch((err) => console.error("Axiom log error:", err)),
        );
      }

      return response;
    },
  };
};
