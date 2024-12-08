import { errorHandle, getUserHeaders, respondWithCache } from "@/utils/base";
import { PlatformType } from "@/utils/platform";
import { regexSns, regexSolana } from "@/utils/regexp";
import { ErrorMessages } from "@/utils/types";
import { NextRequest } from "next/server";
import { resolveSNSHandle } from "./utils";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url as string);
  const handle = searchParams.get("handle");
  const headers = getUserHeaders(req);
  if ((!regexSns.test(handle!) && !regexSolana.test(handle!)) || !handle)
    return errorHandle({
      identity: handle,
      platform: PlatformType.sns,
      code: 404,
      message: ErrorMessages.invalidIdentity,
    });

  try {
    const json = (await resolveSNSHandle(handle, headers)) as any;
    if (json.code) {
      return errorHandle({
        identity: handle,
        platform: PlatformType.sns,
        code: json.code,
        message: json.message,
      });
    }
    return respondWithCache(JSON.stringify(json));
  } catch (e: any) {
    return errorHandle({
      identity: handle,
      platform: PlatformType.sns,
      code: e.cause || 500,
      message: e.message,
    });
  }
}
export const runtime = "edge";
