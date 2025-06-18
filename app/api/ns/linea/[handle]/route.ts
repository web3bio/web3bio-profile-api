import type { NextRequest } from "next/server";
import { ErrorMessages, Platform } from "web3bio-profile-kit/types";
import {
  isValidEthereumAddress,
  REGEX,
  uglify,
} from "web3bio-profile-kit/utils";
import { resolveIdentityHandle } from "@/utils/base";
import { errorHandle, getUserHeaders } from "@/utils/utils";

export async function GET(req: NextRequest) {
  const headers = getUserHeaders(req.headers);
  const { searchParams, pathname } = req.nextUrl;
  const inputName = searchParams.get("handle")?.toLowerCase() || "";
  const handle = isValidEthereumAddress(inputName)
    ? inputName
    : uglify(inputName, Platform.linea);

  if (!REGEX.LINEA.test(handle) && !isValidEthereumAddress(handle))
    return errorHandle({
      identity: handle,
      path: pathname,
      platform: Platform.linea,
      code: 404,
      message: ErrorMessages.INVALID_IDENTITY,
    });

  return resolveIdentityHandle(handle, Platform.linea, headers, true, pathname);
}

export const runtime = "edge";
