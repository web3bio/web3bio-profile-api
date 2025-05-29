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
  const handle = searchParams.get("handle")?.toLowerCase() || "";

  if (!REGEX.LENS.test(handle) && !isValidEthereumAddress(handle)) {
    return errorHandle({
      identity: handle,
      platform: PlatformType.lens,
      code: 404,
      message: ErrorMessages.INVALID_IDENTITY,
    });
  }

  return resolveIdentityHandle(
    prettify(handle),
    PlatformType.lens,
    headers,
    true,
  );
}

export const runtime = "edge";
