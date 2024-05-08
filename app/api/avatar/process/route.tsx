import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
export const runtime = "nodejs";
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const url = searchParams.get("url");
  try {
    new URL(url || "");
  } catch (e) {
    return NextResponse.json("Invalid Image URL");
  }

  try {
    const imageBuffer = await fetch(url!).then((res) => res.arrayBuffer());
    const resultBuffer = await sharp(imageBuffer)
      .toFormat("png")
      .resize(240)
      .toBuffer();

    return new Response(resultBuffer, {
      headers: {
        "Cache-Control":
          "public, s-maxage=604800, stale-while-revalidate=86400",
      },
    });
  } catch (e) {
    return NextResponse.json("Invalid Image URL");
  }
}
