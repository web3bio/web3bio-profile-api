import { errorHandle, getUserHeaders } from "@/utils/utils";
import { PlatformType } from "@/utils/platform";
import { regexSns, regexSolana } from "@/utils/regexp";
import { ErrorMessages } from "@/utils/types";
import { NextRequest } from "next/server";
import { resolveIdentityHandle } from "@/utils/base";

export async function GET(req: NextRequest) {
  const headers = getUserHeaders(req.headers);
  const { searchParams } = req.nextUrl;
  const handle = searchParams.get("handle") || "";

  if (!regexSns.test(handle) && !regexSolana.test(handle))
    return errorHandle({
      identity: handle,
      platform: PlatformType.sns,
      code: 404,
      message: ErrorMessages.invalidIdentity,
    });

  return resolveIdentityHandle(handle, PlatformType.sns, headers, true);
}

export const runtime = "edge";
