import type { NextRequest } from "next/server";
import { ErrorMessages, Platform } from "web3bio-profile-kit/types";
import { isValidEthereumAddress, REGEX } from "web3bio-profile-kit/utils";
import { resolveIdentityHandle } from "@/utils/base";
import { errorHandle, getUserHeaders } from "@/utils/utils";

type RouteParams = {
  params: Promise<{
    handle: string;
  }>;
};

export async function GET(req: NextRequest, { params }: RouteParams) {
  const { handle } = await params;
  const { pathname } = req.nextUrl;

  if (
    !REGEX.UNSTOPPABLE_DOMAINS.test(handle) &&
    !isValidEthereumAddress(handle)
  )
    return errorHandle({
      identity: handle,
      path: pathname,
      platform: Platform.unstoppableDomains,
      code: 404,
      message: ErrorMessages.INVALID_IDENTITY,
    });

  const headers = getUserHeaders(req.headers);
  return resolveIdentityHandle(
    handle,
    Platform.unstoppableDomains,
    headers,
    false,
    pathname,
  );
}
