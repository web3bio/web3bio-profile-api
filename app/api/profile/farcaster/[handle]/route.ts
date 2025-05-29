import {
  errorHandle,
  getUserHeaders,
  isValidEthereumAddress,
  prettify,
} from "@/utils/utils";
import { ErrorMessages, Platform } from "web3bio-profile-kit/types";
import { REGEX } from "web3bio-profile-kit/utils";
import type { NextRequest } from "next/server";
import { resolveIdentityHandle } from "@/utils/base";

export async function GET(req: NextRequest) {
  const headers = getUserHeaders(req.headers);
  const { searchParams } = req.nextUrl;
  const handle = searchParams.get("handle") || "";

  const resolvedHandle = REGEX.SOLANA_ADDRESS.test(handle)
    ? handle
    : handle.toLowerCase();
  if (
    ![
      isValidEthereumAddress(resolvedHandle),
      REGEX.SOLANA_ADDRESS.test(resolvedHandle),
      REGEX.FARCASTER.test(resolvedHandle),
    ].some((x) => !!x)
  )
    return errorHandle({
      identity: resolvedHandle,
      platform: Platform.farcaster,
      code: 404,
      message: ErrorMessages.INVALID_IDENTITY,
    });

  const queryInput = prettify(resolvedHandle);
  return resolveIdentityHandle(queryInput, Platform.farcaster, headers, false);
}

export const runtime = "edge";
