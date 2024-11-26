import { errorHandle, getUserHeaders, respondWithCache } from "@/utils/base";
import { PlatformType } from "@/utils/platform";
import { regexSns, regexSolana } from "@/utils/regexp";
import { ErrorMessages } from "@/utils/types";
import { NextRequest } from "next/server";
import { resolveSNSHandleNS } from "../../sns/[handle]/utils";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const inputName = searchParams.get("handle") || "";
  const headers = getUserHeaders(req);
  if (!regexSns.test(inputName) && !regexSolana.test(inputName))
    return errorHandle({
      identity: inputName,
      platform: PlatformType.solana,
      code: 404,
      message: ErrorMessages.invalidIdentity,
    });
  try {
    const json = await resolveSNSHandleNS(inputName, headers);
    return respondWithCache(JSON.stringify(json), headers);
  } catch (e: any) {
    return errorHandle({
      identity: inputName,
      platform: PlatformType.sns,
      code: e.cause || 500,
      message: e.message,
    });
  }
}
export const runtime = "edge";
