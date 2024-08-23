import { errorHandle, respondWithCache } from "@/utils/base";
import { PlatformType } from "@/utils/platform";
import { regexFarcaster } from "@/utils/regexp";
import { ErrorMessages } from "@/utils/types";
import { resolveFarcasterResponse } from "../../../profile/farcaster/[handle]/utils";
import { NextRequest } from "next/server";

export const runtime = "edge";
const regexFid = /fid:(\d*)/i;
export async function GET(req: NextRequest) {
  const handle = req.nextUrl.searchParams.get("handle")?.toLowerCase() || "";

  if (!regexFarcaster.test(handle) && !regexFid.test(handle)) {
    return errorHandle({
      identity: handle,
      platform: PlatformType.farcaster,
      code: 404,
      message: ErrorMessages.invalidIdentity,
    });
  }

  const queryInput = handle.endsWith(".farcaster")
    ? handle.replace(".farcaster", "")
    : handle;

  try {
    const response = await resolveFarcasterResponse(queryInput);

    if (!response?.fid) {
      throw new Error(ErrorMessages.notFound, { cause: 404 });
    }

    const json = {
      address: response.address || null,
      identity: response.username,
      platform: PlatformType.farcaster,
      displayName: response.displayName || response.username,
      avatar: response.pfp.url,
      description: response.profile.bio.text || null,
    };

    return respondWithCache(JSON.stringify(json));
  } catch (e: any) {
    return errorHandle({
      identity: queryInput,
      platform: PlatformType.farcaster,
      code: e.cause || 404,
      message: e.message || ErrorMessages.notFound,
    });
  }
}
