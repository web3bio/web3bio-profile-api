import { resolveUDHandle } from "@/app/api/profile/unstoppabledomains/[handle]/utils";
import {
  errorHandle,
  getUserHeaders,
  isValidEthereumAddress,
  respondWithCache,
} from "@/utils/base";
import { PlatformType } from "@/utils/platform";
import { regexUnstoppableDomains } from "@/utils/regexp";
import { ErrorMessages } from "@/utils/types";
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

  try {
    const json = (await resolveUDHandle(handle, headers, true)) as any;
    if (json.code) {
      return errorHandle({
        identity: handle,
        platform: PlatformType.unstoppableDomains,
        code: json.code,
        message: json.message,
      });
    }
    return respondWithCache(JSON.stringify(json));
  } catch (e: any) {
    return errorHandle({
      identity: handle,
      platform: PlatformType.unstoppableDomains,
      code: e.cause || 500,
      message: e.message,
    });
  }
}
