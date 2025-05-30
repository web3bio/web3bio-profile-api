import { errorHandle, getUserHeaders } from "@/utils/utils";
import { Platform, ErrorMessages } from "web3bio-profile-kit/types";
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
    : uglify(inputName, Platform.linea);

  if (!REGEX.LINEA.test(handle) && !isValidEthereumAddress(handle))
    return errorHandle({
      identity: handle,
      platform: Platform.linea,
      code: 404,
      message: ErrorMessages.INVALID_IDENTITY,
    });

  return resolveIdentityHandle(handle, Platform.linea, headers, true);
}

export const runtime = "edge";
