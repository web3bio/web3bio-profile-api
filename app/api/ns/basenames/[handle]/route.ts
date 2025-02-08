import {
  errorHandle,
  getUserHeaders,
  isValidEthereumAddress,
  uglify,
} from "@/utils/base";
import { PlatformType } from "@/utils/platform";
import { regexBasenames } from "@/utils/regexp";
import { ErrorMessages } from "@/utils/types";
import { NextRequest } from "next/server";
import { resolveEtherRespond } from "@/utils/utils";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const headers = getUserHeaders(req);
  const inputName = searchParams.get("handle") || "";
  const handle = isValidEthereumAddress(inputName)
    ? inputName
    : uglify(inputName?.toLowerCase(), PlatformType.basenames);
  if (!regexBasenames.test(handle) && !isValidEthereumAddress(handle))
    return errorHandle({
      identity: handle,
      platform: PlatformType.basenames,
      code: 404,
      message: ErrorMessages.invalidIdentity,
    });
  return resolveEtherRespond(handle, headers, PlatformType.basenames, true);
}

export const runtime = "edge";
