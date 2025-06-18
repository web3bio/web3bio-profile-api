import { type NextRequest, NextResponse } from "next/server";
import sharp from "sharp";

export const runtime = "nodejs";

const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
const FETCH_TIMEOUT = 10000; // 10 seconds

function isValidImageUrl(url: string): boolean {
  try {
    const parsedUrl = new URL(url);
    return parsedUrl.protocol === "http:" || parsedUrl.protocol === "https:";
  } catch {
    return false;
  }
}

async function fetchWithTimeout(
  url: string,
  timeout: number,
): Promise<ArrayBuffer> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Web3.bio/1.0",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const contentLength = response.headers.get("content-length");
    if (contentLength && parseInt(contentLength) > MAX_IMAGE_SIZE) {
      throw new Error("Image too large");
    }

    return await response.arrayBuffer();
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const urlParam = searchParams.get("url");

  if (!urlParam) {
    return NextResponse.json(
      { error: "URL parameter is required" },
      { status: 400 },
    );
  }

  if (!isValidImageUrl(urlParam)) {
    return NextResponse.json({ error: "Invalid URL format" }, { status: 400 });
  }

  try {
    const imageBuffer = await fetchWithTimeout(urlParam, FETCH_TIMEOUT);

    if (imageBuffer.byteLength > MAX_IMAGE_SIZE) {
      return NextResponse.json({ error: "Image too large" }, { status: 413 });
    }

    const processedBuffer = await sharp(imageBuffer)
      .rotate() // Auto-rotate based on EXIF
      .resize(480, null, {
        withoutEnlargement: true,
        fastShrinkOnLoad: true,
      })
      .jpeg({
        quality: 88,
        progressive: true,
        mozjpeg: true,
      })
      .toBuffer();

    return new Response(processedBuffer, {
      headers: {
        "Content-Type": "image/jpeg",
        "Cache-Control":
          "public, max-age=43200, s-maxage=604800, stale-while-revalidate=86400",
        "Content-Length": processedBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error("Image processing error:", error);

    if (error instanceof Error) {
      if (error.name === "AbortError") {
        return NextResponse.json({ error: "Request timeout" }, { status: 408 });
      }

      if (error.message.includes("HTTP")) {
        return NextResponse.json(
          { error: "Failed to fetch image" },
          { status: 502 },
        );
      }

      if (error.message.includes("too large")) {
        return NextResponse.json({ error: "Image too large" }, { status: 413 });
      }
    }

    return NextResponse.json(
      { error: "Image processing failed" },
      { status: 500 },
    );
  }
}
