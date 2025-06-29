import { type NextRequest } from "next/server";
import { respondWithSVG } from "./utils";

export async function GET(
  req: NextRequest,
  { params }: { params: { handle: string } },
) {
  const handle = params.handle;

  // Early validation - return minimal SVG for empty handles
  if (!handle) {
    return new Response(
      '<svg xmlns="http://www.w3.org/2000/svg" width="240" height="240"><rect width="240" height="240" fill="#ccc"/></svg>',
      {
        headers: {
          "Content-Type": "image/svg+xml",
          "Cache-Control":
            "public, max-age=604800, s-maxage=604800, stale-while-revalidate=86400",
        },
      },
    );
  }

  return respondWithSVG(handle, 240);
}

export const runtime = "edge";
