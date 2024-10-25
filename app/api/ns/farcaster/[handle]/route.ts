import { errorHandle, prettify, respondWithCache } from "@/utils/base";
import { PlatformType } from "@/utils/platform";
import { regexEth, regexFarcaster } from "@/utils/regexp";
import { ErrorMessages } from "@/utils/types";
import { NextRequest } from "next/server";
import { resolveFarcasterHandleNS } from "./utils";

export const runtime = "edge";
export async function GET(req: NextRequest) {
  const handle = req.nextUrl.searchParams.get("handle")?.toLowerCase() || "";

  if (!regexFarcaster.test(handle) && !regexEth.test(handle)) {
    return errorHandle({
      identity: handle,
      platform: PlatformType.farcaster,
      code: 404,
      message: ErrorMessages.invalidIdentity,
    });
  }

  const queryInput = prettify(handle);

  try {
    const json = await resolveFarcasterHandleNS(queryInput);
    return respondWithCache(JSON.stringify(json));
  } catch (e: any) {
    return errorHandle({
      identity: queryInput,
      platform: PlatformType.farcaster,
      code: e.cause || 404,
      message: e.message || ErrorMessages.notFound,
    });
  }
}
