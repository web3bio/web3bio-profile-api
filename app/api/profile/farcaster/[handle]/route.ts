import { errorHandle, respondWithCache } from "@/utils/base";
import { PlatformType } from "@/utils/platform";
import { regexFarcaster } from "@/utils/regexp";
import { ErrorMessages } from "@/utils/types";
import { NextRequest } from "next/server";
import { resolveFarcasterHandle } from "./utils";

const resolveFarcasterRespond = async (handle: string) => {};

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const handle = searchParams.get("handle")?.toLowerCase() || "";

  const regexFid = /fid:(\d*)/i;

  if (!regexFarcaster.test(handle) && !regexFid.test(handle))
    return errorHandle({
      identity: handle,
      platform: PlatformType.farcaster,
      code: 404,
      message: ErrorMessages.invalidIdentity,
    });
  const queryInput = handle.endsWith(".farcaster")
    ? handle.replace(".farcaster", "")
    : handle;

  try {
    const json = await resolveFarcasterHandle(queryInput);
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
