import { errorHandle, getUserHeaders } from "@/utils/base";
import { PlatformType } from "@/utils/platform";
import { regexUID } from "@/utils/regexp";
import { ErrorMessages } from "@/utils/types";
import { resolveIdentityRespond } from "@/utils/utils";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const headers = getUserHeaders(req.headers);
  const { searchParams } = req.nextUrl;
  const fid = searchParams.get("fid") || "";

  if (!regexUID.test(fid))
    return errorHandle({
      identity: fid,
      platform: PlatformType.farcaster,
      code: 404,
      message: ErrorMessages.invalidIdentity,
    });
  return resolveIdentityRespond(
    `#${fid}`,
    PlatformType.farcaster,
    headers,
    true,
  );
}

export const runtime = "edge";
