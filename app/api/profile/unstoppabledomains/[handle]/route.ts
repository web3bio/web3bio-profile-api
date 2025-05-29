import {
  errorHandle,
  getUserHeaders,
  isValidEthereumAddress,
} from "@/utils/utils";
import { ErrorMessages, PlatformType } from "web3bio-profile-kit/types";
import { REGEX } from "web3bio-profile-kit/utils";
import type { NextRequest } from "next/server";
import { resolveIdentityHandle } from "@/utils/base";

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
      platform: PlatformType.unstoppableDomains,
      code: 404,
      message: ErrorMessages.INVALID_IDENTITY,
    });
  return resolveIdentityHandle(
    handle,
    PlatformType.unstoppableDomains,
    headers,
    false,
  );
}

export const runtime = "edge";
