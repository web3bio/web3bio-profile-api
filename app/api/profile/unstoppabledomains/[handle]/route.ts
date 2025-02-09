import {
  errorHandle,
  getUserHeaders,
  isValidEthereumAddress,
} from "@/utils/base";
import { PlatformType } from "@/utils/platform";
import { regexUnstoppableDomains } from "@/utils/regexp";
import { ErrorMessages } from "@/utils/types";
import { NextRequest } from "next/server";
import { resolveUDRespond } from "./utils";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const handle = searchParams.get("handle")?.toLowerCase() || "";
  const headers = getUserHeaders(req);
  if (!regexUnstoppableDomains.test(handle) && !isValidEthereumAddress(handle))
    return errorHandle({
      identity: handle,
      platform: PlatformType.unstoppableDomains,
      code: 404,
      message: ErrorMessages.invalidIdentity,
    });
  return resolveUDRespond(handle, headers);
}

export const runtime = "edge";
