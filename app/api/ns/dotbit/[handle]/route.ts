import { resolveDotbitHandle } from "@/app/api/profile/dotbit/[handle]/utils";
import { errorHandle, getUserHeaders, isValidEthereumAddress, respondWithCache } from "@/utils/base";
import { PlatformType } from "@/utils/platform";
import { regexDotbit } from "@/utils/regexp";
import { ErrorMessages } from "@/utils/types";
import { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(req: NextRequest) {
  const handle = req.nextUrl.searchParams.get("handle")?.toLowerCase() || "";
  const headers = getUserHeaders(req);
  if (!regexDotbit.test(handle) && !isValidEthereumAddress(handle)) {
    return errorHandle({
      identity: handle,
      platform: PlatformType.dotbit,
      code: 404,
      message: ErrorMessages.invalidIdentity,
    });
  }

  try {
    const json = (await resolveDotbitHandle(handle, headers, true)) as any;
    if (json.code) {
      return errorHandle({
        identity: handle,
        platform: PlatformType.dotbit,
        code: json.code || 500,
        message: json.message || ErrorMessages.unknownError,
      });
    }
    return respondWithCache(JSON.stringify(json));
  } catch (e: any) {
    return errorHandle({
      identity: handle,
      platform: PlatformType.dotbit,
      code: e.cause || 500,
      message: e.message,
    });
  }
}
