import type { NextRequest } from "next/server";
import { Platform, ErrorMessages } from "web3bio-profile-kit/types";
import {
  REGEX,
  uglify,
  isValidEthereumAddress,
} from "web3bio-profile-kit/utils";
import { errorHandle, getUserHeaders } from "@/utils/utils";
import { resolveIdentityHandle } from "@/utils/base";

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
  return resolveIdentityHandle(handle, Platform.basenames, headers, true);
}

export const runtime = "edge";
