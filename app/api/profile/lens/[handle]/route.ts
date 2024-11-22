import { errorHandle, getUserHeaders, respondWithCache } from "@/utils/base";
import { PlatformType } from "@/utils/platform";
import { regexEth, regexLens } from "@/utils/regexp";
import { AuthHeaders, ErrorMessages } from "@/utils/types";
import { NextRequest } from "next/server";
import { resolveLensHandle } from "./utils";

const resolveLensRespond = async (handle: string, headers: AuthHeaders) => {
  try {
    const json = await resolveLensHandle(handle, headers);
    return respondWithCache(JSON.stringify(json));
  } catch (e: any) {
    return errorHandle({
      identity: handle,
      platform: PlatformType.lens,
      code: e.cause || 500,
      message: e.message,
    });
  }
};

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const inputName = searchParams.get("handle");
  const lowercaseName = inputName?.toLowerCase() || "";
  const headers = getUserHeaders(req);
  if (
    ![regexLens.test(lowercaseName), regexEth.test(lowercaseName)].some(
      (x) => !!x
    )
  )
    return errorHandle({
      identity: lowercaseName,
      platform: PlatformType.lens,
      code: 404,
      message: ErrorMessages.invalidIdentity,
    });
  return resolveLensRespond(lowercaseName, headers);
}

export const runtime = "edge";
