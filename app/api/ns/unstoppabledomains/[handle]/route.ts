import { resolveUDResponse } from "@/app/api/profile/unstoppabledomains/[handle]/utils";
import { errorHandle, respondWithCache } from "@/utils/base";
import { PlatformType } from "@/utils/platform";
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
    const { address, domain, metadata } = await resolveUDResponse(handle);

    const json = {
      address,
      identity: domain,
      platform: PlatformType.unstoppableDomains,
      displayName: metadata.profile.displayName || handle,
      avatar: metadata.profile.imagePath || null,
      description: metadata.profile.description || null,
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
