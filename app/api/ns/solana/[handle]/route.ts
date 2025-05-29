import { errorHandle, getUserHeaders } from "@/utils/utils";
import { ErrorMessages, Platform } from "web3bio-profile-kit/types";
import { REGEX } from "web3bio-profile-kit/utils";
import type { NextRequest } from "next/server";
import { resolveIdentityHandle } from "@/utils/base";

export async function GET(req: NextRequest) {
  const headers = getUserHeaders(req.headers);
  const { searchParams } = req.nextUrl;
  const handle = searchParams.get("handle") || "";

  if (!REGEX.SNS.test(handle) && !REGEX.SOLANA_ADDRESS.test(handle))
    return errorHandle({
      identity: handle,
      platform: Platform.solana,
      code: 404,
      message: ErrorMessages.INVALID_IDENTITY,
    });

  return resolveIdentityHandle(handle, Platform.sns, headers, true);
}
export const runtime = "edge";
