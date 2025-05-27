import {
  errorHandle,
  getUserHeaders,
  isValidEthereumAddress,
} from "@/utils/utils";
import { PlatformType } from "@/utils/platform";
import { regexUnstoppableDomains } from "@/utils/regexp";
import { ErrorMessages } from "@/utils/types";
import type { NextRequest } from "next/server";
import { resolveIdentityHandle } from "@/utils/base";

export async function GET(req: NextRequest) {
  const headers = getUserHeaders(req.headers);
  const { searchParams } = req.nextUrl;
  const handle = searchParams.get("handle")?.toLowerCase() || "";

  if (!regexUnstoppableDomains.test(handle) && !isValidEthereumAddress(handle))
    return errorHandle({
      identity: handle,
      platform: PlatformType.unstoppableDomains,
      code: 404,
      message: ErrorMessages.invalidIdentity,
    });
  return resolveIdentityHandle(
    handle,
    PlatformType.unstoppableDomains,
    headers,
    false,
  );
}

export const runtime = "edge";
