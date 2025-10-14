import { type NextRequest } from "next/server";

const FETCH_TIMEOUT = 10000; // 10 seconds

async function fetchWithTimeout(
  url: string,
  timeout: number,
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Web3.bio/1.0",
      },
      cf: {
        image: {
          width: 480,
          quality: 88,
          format: "jpeg",
          fit: "scale-down",
          metadata: "none",
        },
        cacheEverything: true,
        cacheTtl: 86400,
      },
    } as RequestInit);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const urlParam = searchParams.get("url");

  if (!urlParam) {
    return new Response(
      JSON.stringify({ error: "URL parameter is required" }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  try {
    const response = await fetchWithTimeout(urlParam, FETCH_TIMEOUT);

    const contentType = response.headers.get("content-type");
    if (!contentType?.startsWith("image/")) {
      return new Response(JSON.stringify({ error: "error format" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const imageBuffer = await response.arrayBuffer();

    return new Response(imageBuffer, {
      headers: {
        "Content-Type": "image/jpeg",
        "Cache-Control":
          "public, max-age=43200, s-maxage=604800, stale-while-revalidate=86400",
        "Content-Length": imageBuffer.byteLength.toString(),
        "CDN-Cache-Control": "max-age=604800",
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: "Image processing failed" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
