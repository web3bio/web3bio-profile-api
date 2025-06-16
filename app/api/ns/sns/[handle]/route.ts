import type { NextRequest } from "next/server";
import { ErrorMessages, Platform } from "web3bio-profile-kit/types";
import { isValidSolanaAddress, REGEX } from "web3bio-profile-kit/utils";
import { resolveIdentityHandle } from "@/utils/base";
import { errorHandle, getUserHeaders } from "@/utils/utils";

export async function GET(req: NextRequest) {
  const headers = getUserHeaders(req.headers);
  const { searchParams, pathname } = req.nextUrl;
  const handle = searchParams.get("handle") || "";

  if (!REGEX.SNS.test(handle) && !isValidSolanaAddress(handle))
    return errorHandle({
      identity: handle,
      path: pathname,
      platform: Platform.sns,
      code: 404,
      message: ErrorMessages.INVALID_IDENTITY,
    });

  return resolveIdentityHandle(handle, Platform.sns, headers, true, pathname);
}

export const runtime = "edge";
