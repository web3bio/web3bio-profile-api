import type { NextRequest } from "next/server";
import { lookupAssociatedAccounts } from "../utils";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ handle: string }> },
) {
  const { handle } = await params;
  return lookupAssociatedAccounts(req, [handle], true);
}
