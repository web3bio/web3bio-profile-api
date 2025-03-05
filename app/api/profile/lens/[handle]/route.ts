import {
  errorHandle,
  getUserHeaders,
  isValidEthereumAddress,
} from "@/utils/base";
import { PlatformType } from "@/utils/platform";
import { regexLens } from "@/utils/regexp";
import { ErrorMessages } from "@/utils/types";
import { NextRequest } from "next/server";
import { resolveIdentityRespond } from "@/utils/utils";

export async function GET(req: NextRequest) {
  const headers = getUserHeaders(req.headers);
  const { searchParams } = req.nextUrl;
  const handle = searchParams.get("handle")?.toLowerCase() || "";

  if (!regexLens.test(handle) && !isValidEthereumAddress(handle))
    return errorHandle({
      identity: handle,
      platform: PlatformType.lens,
      code: 404,
      message: ErrorMessages.invalidIdentity,
    });
  return resolveIdentityRespond(handle, PlatformType.lens, headers, false);
}

export const runtime = "edge";
