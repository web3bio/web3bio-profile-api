import {
  errorHandle,
  getUserHeaders,
  isValidEthereumAddress,
} from "@/utils/base";
import { PlatformType } from "@/utils/platform";
import { regexDotbit } from "@/utils/regexp";
import { ErrorMessages } from "@/utils/types";
import { resolveIdentityHandle } from "@/utils/utils";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const headers = getUserHeaders(req.headers);
  const { searchParams } = req.nextUrl;
  const handle = searchParams.get("handle")?.toLowerCase() || "";

  if (!regexDotbit.test(handle) && !isValidEthereumAddress(handle))
    return errorHandle({
      identity: handle,
      platform: PlatformType.dotbit,
      code: 404,
      message: ErrorMessages.invalidIdentity,
    });
  return resolveIdentityHandle(handle, PlatformType.dotbit, headers, false);
}

export const runtime = "edge";
