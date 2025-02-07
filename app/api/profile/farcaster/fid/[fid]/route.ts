import { errorHandle, getUserHeaders, respondWithCache } from "@/utils/base";
import { PlatformType } from "@/utils/platform";
import { regexUID } from "@/utils/regexp";
import { ErrorMessages } from "@/utils/types";
import { NextRequest } from "next/server";
import { resolveFarcasterHandle } from "../../[handle]/utils";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const fid = searchParams.get("fid")?.toLowerCase() || "";
  const headers = getUserHeaders(req);
  if (!regexUID.test(fid))
    return errorHandle({
      identity: fid,
      platform: PlatformType.farcaster,
      code: 404,
      message: ErrorMessages.invalidIdentity,
    });

  try {
    const json = await resolveFarcasterHandle(`#${fid}`, headers);
    if (json.code) {
      return errorHandle({
        identity: `#${fid}`,
        platform: PlatformType.farcaster,
        code: json.code,
        message: json.message,
      });
    }
    return respondWithCache(JSON.stringify(json));
  } catch (e: any) {
    return errorHandle({
      identity: fid,
      platform: PlatformType.farcaster,
      code: e.cause || 500,
      message: e.message,
    });
  }
}

export const runtime = "edge";
