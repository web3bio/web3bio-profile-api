import type { NextRequest } from "next/server";
import { ErrorMessages, Platform } from "web3bio-profile-kit/types";
import { isValidEthereumAddress, REGEX } from "web3bio-profile-kit/utils";
import { resolveIdentityHandle } from "@/utils/base";
import { errorHandle, getUserHeaders } from "@/utils/utils";

export async function GET(req: NextRequest) {
  const headers = getUserHeaders(req.headers);
  const { searchParams } = req.nextUrl;
  const handle = searchParams.get("handle")?.toLowerCase() || "";

  if (
    !REGEX.UNSTOPPABLE_DOMAINS.test(handle) &&
    !isValidEthereumAddress(handle)
  )
    return errorHandle({
      identity: handle,
      platform: Platform.unstoppableDomains,
      code: 404,
      message: ErrorMessages.INVALID_IDENTITY,
    });
  return resolveIdentityHandle(
    handle,
    Platform.unstoppableDomains,
    headers,
    false,
  );
}

export const runtime = "edge";
