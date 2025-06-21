import { type NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

// e.g `https://api.web3.bio/revalidate?path=/[domain]`
export async function GET(request: NextRequest) {
  const path = request.nextUrl.searchParams.get("path");

  if (!path) {
    return NextResponse.json(
      { message: "Missing path param" },
      { status: 400 },
    );
  }

  try {
    revalidatePath(path);
    return NextResponse.json({
      path,
      revalidated: true,
      now: Date.now(),
    });
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to revalidate path" },
      { status: 500 },
    );
  }
}
