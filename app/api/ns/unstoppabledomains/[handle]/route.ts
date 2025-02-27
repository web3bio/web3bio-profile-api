import {
  errorHandle,
  getUserHeaders,
  isValidEthereumAddress,
} from "@/utils/base";
import { PlatformType } from "@/utils/platform";
import { regexUnstoppableDomains } from "@/utils/regexp";
import { ErrorMessages } from "@/utils/types";
import { resolveIdentityRespond } from "@/utils/utils";
import { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(req: NextRequest) {
  const handle = req.nextUrl.searchParams.get("handle")?.toLowerCase() || "";
  const headers = getUserHeaders(req);
  if (
    !regexUnstoppableDomains.test(handle) &&
    !isValidEthereumAddress(handle)
  ) {
    return errorHandle({
      identity: handle,
      platform: PlatformType.unstoppableDomains,
      code: 404,
      message: ErrorMessages.invalidIdentity,
    });
  }
  return resolveIdentityRespond(
    handle,
    PlatformType.unstoppableDomains,
    headers,
    true
  );
}
