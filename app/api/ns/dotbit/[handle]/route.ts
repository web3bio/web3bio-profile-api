import { errorHandle, respondWithCache } from "@/utils/base";
import { PlatformType } from "@/utils/platform";
import { regexDotbit, regexEth } from "@/utils/regexp";
import { ErrorMessages } from "@/utils/types";
import { resolveDotbitResponse } from "@/app/api/profile/dotbit/[handle]/utils";
import { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(req: NextRequest) {
  const handle = req.nextUrl.searchParams.get("handle")?.toLowerCase() || "";

  if (!regexDotbit.test(handle) && !regexEth.test(handle)) {
    return errorHandle({
      identity: handle,
      platform: PlatformType.dotbit,
      code: 404,
      message: ErrorMessages.invalidIdentity,
    });
  }

  try {
    const { address, domain, recordsMap } = await resolveDotbitResponse(handle);

    const json = {
      address,
      identity: domain,
      platform: PlatformType.dotbit,
      displayName: domain || null,
      avatar: recordsMap.get("profile.avatar")?.value || null,
      description: recordsMap.get("profile.description")?.value || null,
    };

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
