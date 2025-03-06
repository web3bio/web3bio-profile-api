import { errorHandle, getUserHeaders } from "@/utils/base";
import { PlatformType } from "@/utils/platform";
import { regexUID } from "@/utils/regexp";
import { ErrorMessages } from "@/utils/types";
import { NextRequest } from "next/server";
import { resolveIdentityHandle } from "@/utils/utils";

export async function GET(req: NextRequest) {
  const headers = getUserHeaders(req.headers);
  const { searchParams } = req.nextUrl;
  const uid = searchParams.get("uid")?.toLowerCase() || "";

  if (!regexUID.test(uid))
    return errorHandle({
      identity: uid,
      platform: PlatformType.lens,
      code: 404,
      message: ErrorMessages.invalidIdentity,
    });
  return resolveIdentityHandle(`#${uid}`, PlatformType.lens, headers, false);
}

export const runtime = "edge";
