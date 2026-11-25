import type { NextRequest } from "next/server";
import { getBestiesAssociatedAccounts } from "../../besties/utils";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ identity: string }> },
) {
  const { identity } = await params;
  return getBestiesAssociatedAccounts(req, identity, { flat: true });
}
