import { errorHandle, getUserHeaders } from "@/utils/base";
import { PlatformType } from "@/utils/platform";
import { regexUID } from "@/utils/regexp";
import { ErrorMessages } from "@/utils/types";
import { resolveIdentityRespond } from "@/utils/utils";
import { NextRequest } from "next/server";

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
  return resolveIdentityRespond(`#${uid}`, PlatformType.lens, headers, true);
}

export const runtime = "edge";
