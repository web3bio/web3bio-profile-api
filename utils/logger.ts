const LOG_PATHS = ["/avatar/", "/domain/", "/ns/", "/profile/", "/credential/"];

export const withLogging = (handler: any) => {
  return {
    async fetch(request: Request, env: any, ctx: any) {
      const url = new URL(request.url);
      const startTime = Date.now();

      const response = await handler.fetch(request, env, ctx);
      if (LOG_PATHS.some((path) => url.pathname.startsWith(path))) {
        const duration = Date.now() - startTime;
        const pathParts = url.pathname.split("/");
        const endpoint = pathParts.slice(1, -1).join("/") || "unknown";
        const identity = pathParts[pathParts.length - 1] || "unknown";
        const apiKey = (() => {
          const key = (request.headers.get("x-api-key") || "none").replace(
            "Bearer ",
            "",
          );
          return key.includes(".") ? key.split(".").pop() : "none";
        })();

        const logData = {
          _time: new Date().toISOString(),
          method: request.method,
          path: url.pathname,
          query: url.search || "none",
          endpoint,
          identity,
          status: response.status,
          host: request.headers.get("host") || "unknown",
          origin: request.headers.get("origin") || "none",
          referer: request.headers.get("referer") || "none",
          success: response.ok,
          duration_ms: duration,
          user_agent: request.headers.get("user-agent") || "unknown",
          content_type: request.headers.get("content-type") || "none",
          api_key: apiKey,
          ip:
            request.headers.get("cf-connecting-ip") ||
            request.headers.get("x-forwarded-for") ||
            request.headers.get("x-real-ip") ||
            "unknown",
          country: (request as any).cf?.country || "unknown",
          city: (request as any).cf?.city || "unknown",
          cache_hit: response.headers.get("X-CACHE-HIT") || "none",
          cache_age: response.headers.get("X-Cache-Age") || "0",
          content_length: response.headers.get("content-length") || "0",
          level: response.status >= 400 ? "error" : "info",
          is_error: response.status >= 400,
          error_type:
            response.status >= 500
              ? "server_error"
              : response.status >= 400
                ? "client_error"
                : "none",
        };
        if (!env.AXIOM_DATASET || !env.AXIOM_API_TOKEN) {
          console.warn(
            "Axiom logging skipped: AXIOM_DATASET or AXIOM_API_TOKEN is not defined.",
          );
        } else {
          ctx.waitUntil(
            fetch(
              `https://api.axiom.co/v1/datasets/${env.AXIOM_DATASET}/ingest`,
              {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${env.AXIOM_API_TOKEN}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify([logData]),
              },
            ).catch((err) => console.error("Axiom log error:", err)),
          );
        }
      }

      return response;
    },
  };
};
