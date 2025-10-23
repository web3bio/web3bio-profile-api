import type { NextRequest } from "next/server";
import { ErrorMessages, Platform } from "web3bio-profile-kit/types";
import {
  REGEX,
  isValidEthereumAddress,
  prettify,
} from "web3bio-profile-kit/utils";
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

  // Early return for empty handle
  if (!handle) {
    return errorHandle({
      identity: "",
      path: pathname,
      platform: Platform.farcaster,
      code: 404,
      message: ErrorMessages.INVALID_IDENTITY,
    });
  }

  // Normalize handle
  const resolvedHandle = REGEX.SOLANA_ADDRESS.test(handle)
    ? handle
    : handle.toLowerCase();

  // Validate handle format
  const isValidEth = isValidEthereumAddress(resolvedHandle);
  const isValidSolana = REGEX.SOLANA_ADDRESS.test(resolvedHandle);
  const isValidFarcaster = REGEX.FARCASTER.test(resolvedHandle);

  if (!isValidEth && !isValidSolana && !isValidFarcaster) {
    return errorHandle({
      identity: resolvedHandle,
      path: pathname,
      platform: Platform.farcaster,
      code: 404,
      message: ErrorMessages.INVALID_IDENTITY,
    });
  }

  const queryInput = prettify(resolvedHandle);
  const headers = getUserHeaders(req.headers);

  return resolveIdentityHandle(
    queryInput,
    Platform.farcaster,
    headers,
    true,
    pathname,
  );
}
