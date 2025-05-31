import { resolveIdentityHandle } from "@/utils/base";
import { errorHandle, getUserHeaders } from "@/utils/utils";
import type { NextRequest } from "next/server";
import { ErrorMessages, Platform } from "web3bio-profile-kit/types";
import {
  REGEX,
  isValidEthereumAddress,
  prettify,
} from "web3bio-profile-kit/utils";

export async function GET(req: NextRequest) {
  const headers = getUserHeaders(req.headers);
  const { searchParams } = req.nextUrl;
  const handle = searchParams.get("handle")?.toLowerCase() || "";

  if (!REGEX.LENS.test(handle) && !isValidEthereumAddress(handle)) {
    return errorHandle({
      identity: handle,
      platform: Platform.lens,
      code: 404,
      message: ErrorMessages.INVALID_IDENTITY,
    });
  }

  return resolveIdentityHandle(prettify(handle), Platform.lens, headers, false);
}

export const runtime = "edge";
