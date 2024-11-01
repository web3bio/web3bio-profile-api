import { errorHandle, respondWithCache } from "@/utils/base";
import { PlatformType } from "@/utils/platform";
import { GET_PROFILES, queryIdentityGraph } from "@/utils/query";
import { regexEth, regexUnstoppableDomains } from "@/utils/regexp";
import { ErrorMessages } from "@/utils/types";
import { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(req: NextRequest) {
  const handle = req.nextUrl.searchParams.get("handle")?.toLowerCase() || "";

  if (!regexUnstoppableDomains.test(handle) && !regexEth.test(handle)) {
    return errorHandle({
      identity: handle,
      platform: PlatformType.unstoppableDomains,
      code: 404,
      message: ErrorMessages.invalidIdentity,
    });
  }

  try {
    const response = await queryIdentityGraph(
      handle,
      PlatformType.unstoppableDomains,
      GET_PROFILES(true)
    );
    const profile = response?.data?.identity?.profile;
    if (!profile) throw new Error(ErrorMessages.notFound, { cause: 404 });
    const json = {
      address: profile.address,
      identity: profile.identity,
      platform: PlatformType.unstoppableDomains,
      displayName: profile.displayName || handle,
      avatar: profile.avatar || null,
      description: profile.description || null,
    };

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
