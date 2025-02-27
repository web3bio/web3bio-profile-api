import {
  errorHandle,
  getUserHeaders,
  isValidEthereumAddress,
  uglify,
} from "@/utils/base";
import { PlatformType } from "@/utils/platform";
import { regexLinea } from "@/utils/regexp";
import { ErrorMessages } from "@/utils/types";
import { resolveIdentityRespond } from "@/utils/utils";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const headers = getUserHeaders(req);
  const inputName = searchParams.get("handle") || "";
  const handle = isValidEthereumAddress(inputName)
    ? inputName
    : uglify(inputName?.toLowerCase(), PlatformType.linea);
  if (!regexLinea.test(handle) && !isValidEthereumAddress(handle))
    return errorHandle({
      identity: handle,
      platform: PlatformType.linea,
      code: 404,
      message: ErrorMessages.invalidIdentity,
    });
  return resolveIdentityRespond(handle, PlatformType.linea, headers, true);
}

export const runtime = "edge";
