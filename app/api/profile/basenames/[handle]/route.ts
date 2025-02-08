import {
  errorHandle,
  getUserHeaders,
  isValidEthereumAddress,
  uglify,
} from "@/utils/base";
import { PlatformType } from "@/utils/platform";
import { regexBasenames } from "@/utils/regexp";
import { ErrorMessages } from "@/utils/types";
import { resolveEtherRespond } from "@/utils/utils";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const inputName = searchParams.get("handle") || "";
  const headers = getUserHeaders(req);
  const handle = isValidEthereumAddress(inputName)
    ? inputName.toLowerCase()
    : uglify(inputName, PlatformType.basenames);
  if (!regexBasenames.test(handle) && !isValidEthereumAddress(handle))
    return errorHandle({
      identity: handle,
      platform: PlatformType.basenames,
      code: 404,
      message: ErrorMessages.invalidIdentity,
    });

  return resolveEtherRespond(handle, headers, PlatformType.basenames, false);
}

export const runtime = "edge";
