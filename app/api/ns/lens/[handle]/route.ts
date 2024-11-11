import {
  errorHandle,
  respondWithCache,
} from "@/utils/base";
import { PlatformType } from "@/utils/platform";
import { regexEth, regexLens } from "@/utils/regexp";
import { ErrorMessages } from "@/utils/types";
import { NextRequest } from "next/server";
import { resolveLensHandleNS } from "./utils";

export const runtime = "edge";

export async function GET(req: NextRequest) {
  const handle = req.nextUrl.searchParams.get("handle")?.toLowerCase() || "";

  if (!regexLens.test(handle) && !regexEth.test(handle)) {
    return errorHandle({
      identity: handle,
      platform: PlatformType.lens,
      code: 404,
      message: ErrorMessages.invalidIdentity,
    });
  }

  try {
    const json = await resolveLensHandleNS(handle);
    return respondWithCache(JSON.stringify(json));
  } catch (e: any) {
    return errorHandle({
      identity: handle,
      platform: PlatformType.lens,
      code: e.cause || 500,
      message: e.message,
    });
  }
}
