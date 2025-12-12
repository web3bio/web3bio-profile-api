import { type NextRequest } from "next/server";
import { respondWithSVG } from "./utils";

const AVATAR_SIZE = 240;
const EMPTY_AVATAR_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="${AVATAR_SIZE}" height="${AVATAR_SIZE}"><rect width="${AVATAR_SIZE}" height="${AVATAR_SIZE}" fill="#ccc"/></svg>`;

export async function GET(
  _req: NextRequest,
  props: { params: Promise<{ handle: string }> },
) {
  const { handle } = await props.params;

  if (!handle) {
    return new Response(EMPTY_AVATAR_SVG, {
      headers: { "Content-Type": "image/svg+xml" },
    });
  }

  return respondWithSVG(handle, AVATAR_SIZE);
}
