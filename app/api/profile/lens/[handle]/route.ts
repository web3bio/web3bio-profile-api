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
  const { handle } = await params;
  const { pathname } = req.nextUrl;

  if (!REGEX.LENS.test(handle) && !isValidEthereumAddress(handle)) {
    return errorHandle({
      identity: handle,
      path: pathname,
      platform: Platform.lens,
      code: 404,
      message: ErrorMessages.INVALID_IDENTITY,
    });
  }

  const headers = getUserHeaders(req.headers);
  return resolveIdentityHandle(
    prettify(handle),
    Platform.lens,
    headers,
    false,
    pathname,
  );
}
