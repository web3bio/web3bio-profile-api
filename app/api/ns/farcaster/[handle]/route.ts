import {
  errorHandle,
  getUserHeaders,
  isValidEthereumAddress,
  prettify,
} from "@/utils/utils";
import { PlatformType, ErrorMessages } from "web3bio-profile-kit/types";
import { resolveIdentityHandle } from "@/utils/base";
import type { NextRequest } from "next/server";
import { REGEX } from "web3bio-profile-kit/utils";

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
      platform: PlatformType.farcaster,
      code: 404,
      message: ErrorMessages.INVALID_IDENTITY,
    });

  const queryInput = prettify(resolvedHandle);
  return resolveIdentityHandle(
    queryInput,
    PlatformType.farcaster,
    headers,
    true,
  );
}

export const runtime = "edge";
