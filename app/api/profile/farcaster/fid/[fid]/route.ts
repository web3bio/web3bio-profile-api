import { errorHandle, getUserHeaders } from "@/utils/base";
import { PlatformType } from "@/utils/platform";
import { regexUID } from "@/utils/regexp";
import { ErrorMessages } from "@/utils/types";
import { NextRequest } from "next/server";
import { resolveIdentityRespond } from "@/utils/utils";

export async function GET(req: NextRequest) {
  const headers = getUserHeaders(req.headers);
  const { searchParams } = req.nextUrl;
  const fid = searchParams.get("fid")?.toLowerCase() || "";

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
    false,
  );
}

export const runtime = "edge";
