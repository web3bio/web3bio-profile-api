import type { NextRequest } from "next/server";
import { ErrorMessages, Platform } from "web3bio-profile-kit/types";
import {
  REGEX,
  isValidEthereumAddress,
  prettify,
} from "web3bio-profile-kit/utils";
import { resolveIdentityHandle } from "@/utils/base";
import { errorHandle, getUserHeaders } from "@/utils/utils";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ handle: string }> },
) {
  const { handle: rawHandle } = await params;
  const { pathname } = req.nextUrl;
  const handle = rawHandle?.trim() ?? "";

  if (!handle) {
    return errorHandle({
      identity: "",
      path: pathname,
      platform: Platform.farcaster,
      code: 404,
      message: ErrorMessages.INVALID_IDENTITY,
    });
  }

  const isSolanaAddress = REGEX.SOLANA_ADDRESS.test(handle);
  const resolvedHandle = isSolanaAddress
    ? handle
    : handle.toLowerCase();

  const isValidEth = isValidEthereumAddress(resolvedHandle);
  const isValidSolana = isSolanaAddress;
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
    false,
    pathname,
  );
}
