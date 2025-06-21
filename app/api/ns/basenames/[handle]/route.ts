import type { NextRequest } from "next/server";
import { ErrorMessages, Platform } from "web3bio-profile-kit/types";
import {
  isValidEthereumAddress,
  REGEX,
  uglify,
} from "web3bio-profile-kit/utils";
import { resolveIdentityHandle } from "@/utils/base";
import { errorHandle, getUserHeaders } from "@/utils/utils";

export async function GET(
  req: NextRequest,
  { params }: { params: { handle: string } },
) {
  const { pathname } = req.nextUrl;
  const inputName = params.handle.toLowerCase();
  const isEthAddress = isValidEthereumAddress(inputName);

  const handle = isEthAddress
    ? inputName
    : uglify(inputName, Platform.basenames);

  // Skip regex validation for valid Ethereum addresses
  if (!isEthAddress && !REGEX.BASENAMES.test(handle)) {
    return errorHandle({
      identity: handle,
      path: pathname,
      platform: Platform.basenames,
      code: 404,
      message: ErrorMessages.INVALID_IDENTITY,
    });
  }

  const headers = getUserHeaders(req.headers);

  return resolveIdentityHandle(
    handle,
    Platform.basenames,
    headers,
    true,
    pathname,
  );
}
export const runtime = "edge";
