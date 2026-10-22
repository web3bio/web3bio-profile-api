import type { NextRequest } from "next/server";
import { getSocialGraph } from "../utils";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ handle: string }> },
) {
  const { handle } = await params;
  return getSocialGraph(req, handle);
}
