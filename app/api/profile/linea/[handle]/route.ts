import {
  errorHandle,
  getUserHeaders,
  isValidEthereumAddress,
  uglify,
} from "@/utils/utils";
import { ErrorMessages, PlatformType } from "web3bio-profile-kit/types";
import { REGEX } from "web3bio-profile-kit/utils";
import { resolveIdentityHandle } from "@/utils/base";
import type { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const headers = getUserHeaders(req.headers);
  const { searchParams } = req.nextUrl;
  const inputName = searchParams.get("handle") || "";

  const handle = isValidEthereumAddress(inputName)
    ? inputName.toLowerCase()
    : uglify(inputName, PlatformType.linea);

  if (!REGEX.LINEA.test(handle) && !isValidEthereumAddress(handle))
    return errorHandle({
      identity: handle,
      platform: PlatformType.linea,
      code: 404,
      message: ErrorMessages.INVALID_IDENTITY,
    });
  return resolveIdentityHandle(handle, PlatformType.linea, headers, false);
}

export const runtime = "edge";
