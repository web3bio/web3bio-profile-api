import { type NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");

  if (!url) {
    return Response.json({ error: "URL required" }, { status: 400 });
  }

  const controller = new AbortController();
  setTimeout(() => controller.abort(), 10000);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "Web3.bio/1.0" },
      cf: {
        image: { width: 480, quality: 88, format: "jpeg", fit: "scale-down" },
        cacheTtl: 86400,
      },
    } as RequestInit);

    if (!res.ok || !res.headers.get("content-type")?.startsWith("image/")) {
      throw new Error();
    }

    return new Response(res.body, {
      headers: {
        "Content-Type": "image/jpeg",
        "Cache-Control": "public, max-age=43200, s-maxage=604800",
      },
    });
  } catch {
    return Response.json({ error: "Failed" }, { status: 500 });
  }
}
