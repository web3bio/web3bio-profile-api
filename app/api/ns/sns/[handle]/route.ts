import { errorHandle, getUserHeaders } from "@/utils/base";
import { PlatformType } from "@/utils/platform";
import { regexSns, regexSolana } from "@/utils/regexp";
import { ErrorMessages } from "@/utils/types";
import { NextRequest } from "next/server";
import { resolveIdentityRespond } from "@/utils/utils";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const handle = searchParams.get("handle") || "";
  const headers = getUserHeaders(req);
  if (!regexSns.test(handle) && !regexSolana.test(handle))
    return errorHandle({
      identity: handle,
      platform: PlatformType.sns,
      code: 404,
      message: ErrorMessages.invalidIdentity,
    });
  return resolveIdentityRespond(handle, PlatformType.sns, headers, true);
}

export const runtime = "edge";
