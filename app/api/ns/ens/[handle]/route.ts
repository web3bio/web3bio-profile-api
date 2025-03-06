import {
  errorHandle,
  getUserHeaders,
  isValidEthereumAddress,
} from "@/utils/base";
import { PlatformType } from "@/utils/platform";
import { regexEns } from "@/utils/regexp";
import { ErrorMessages } from "@/utils/types";
import { resolveIdentityHandle } from "@/utils/utils";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const headers = getUserHeaders(req.headers);
  const { searchParams } = req.nextUrl;
  const handle = searchParams.get("handle")?.toLowerCase() || "";

  if (!regexEns.test(handle) && !isValidEthereumAddress(handle))
    return errorHandle({
      identity: handle,
      platform: PlatformType.ens,
      code: 404,
      message: ErrorMessages.invalidIdentity,
    });
  return resolveIdentityHandle(handle, PlatformType.ens, headers, true);
}

export const runtime = "edge";
