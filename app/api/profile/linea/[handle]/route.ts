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
  const headers = getUserHeaders(req.headers);
  const { searchParams } = req.nextUrl;
  const inputName = searchParams.get("handle") || "";

  const handle = isValidEthereumAddress(inputName)
    ? inputName.toLowerCase()
    : uglify(inputName, PlatformType.linea);

  if (!regexLinea.test(handle) && !isValidEthereumAddress(handle))
    return errorHandle({
      identity: handle,
      platform: PlatformType.linea,
      code: 404,
      message: ErrorMessages.invalidIdentity,
    });
  return resolveIdentityRespond(handle, PlatformType.linea, headers, false);
}

export const runtime = "edge";
