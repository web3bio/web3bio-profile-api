import type { NextRequest } from "next/server";
import { invalidIdentityResponse } from "@/utils/utils";
import { getBestiesAssociatedAccounts } from "../utils";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ handle: string }> },
) {
  const { handle } = await params;
  if (!handle.startsWith("farcaster,")) {
    return invalidIdentityResponse(req.nextUrl.pathname, handle, null, 400);
  }
  return getBestiesAssociatedAccounts(req, handle);
}
