import { errorHandle, getUserHeaders } from "@/utils/utils";
import { ErrorMessages, Platform } from "web3bio-profile-kit/types";
import {
  isValidEthereumAddress,
  REGEX,
  uglify,
} from "web3bio-profile-kit/utils";
import { resolveIdentityHandle } from "@/utils/base";
import type { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const headers = getUserHeaders(req.headers);
  const { searchParams } = req.nextUrl;

  const inputName = searchParams.get("handle")?.toLowerCase() || "";
  const handle = isValidEthereumAddress(inputName)
    ? inputName
    : uglify(inputName, Platform.basenames);

  if (!REGEX.BASENAMES.test(handle) && !isValidEthereumAddress(handle))
    return errorHandle({
      identity: handle,
      platform: Platform.basenames,
      code: 404,
      message: ErrorMessages.INVALID_IDENTITY,
    });

  return resolveIdentityHandle(handle, Platform.basenames, headers, false);
}

export const runtime = "edge";
