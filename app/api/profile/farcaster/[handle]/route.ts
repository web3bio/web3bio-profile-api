import {
  errorHandle,
  getUserHeaders,
  isValidEthereumAddress,
  prettify,
  respondWithCache,
} from "@/utils/base";
import { PlatformType } from "@/utils/platform";
import { regexFarcaster, regexSolana } from "@/utils/regexp";
import { ErrorMessages } from "@/utils/types";
import { NextRequest } from "next/server";
import { resolveFarcasterHandle } from "./utils";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const headers = getUserHeaders(req);
  const handle = searchParams.get("handle") || "";
  const resolvedHandle = regexSolana.test(handle)
    ? handle
    : handle.toLowerCase();

  if (
    ![
      isValidEthereumAddress(resolvedHandle),
      regexSolana.test(resolvedHandle),
      regexFarcaster.test(resolvedHandle),
      /#\d+/.test(handle),
    ].some((x) => !!x)
  )
    return errorHandle({
      identity: resolvedHandle,
      platform: PlatformType.farcaster,
      code: 404,
      message: ErrorMessages.invalidIdentity,
    });
  const queryInput = prettify(resolvedHandle);

  try {
    const json = await resolveFarcasterHandle(queryInput, headers);
    if (json.code) {
      return errorHandle({
        identity: handle,
        platform: PlatformType.farcaster,
        code: json.code,
        message: json.message,
      });
    }
    return respondWithCache(JSON.stringify(json));
  } catch (e: any) {
    return errorHandle({
      identity: queryInput,
      platform: PlatformType.farcaster,
      code: e.cause || 500,
      message: e.message,
    });
  }
}

export const runtime = "edge";
