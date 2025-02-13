import { errorHandle, getUserHeaders, shouldPlatformFetch } from "@/utils/base";
import { ErrorMessages } from "@/utils/types";
import { NextRequest } from "next/server";
import { resolveUniversalHandle, resolveUniversalParams } from "./utils";

export async function GET(req: NextRequest) {
  const handle = req.nextUrl.searchParams.get("handle") || "";
  const headers = getUserHeaders(req);
  const { identity, platform } = resolveUniversalParams(handle);

  if (!identity || !platform || !shouldPlatformFetch(platform)) {
    return errorHandle({
      identity: identity,
      code: 404,
      platform: platform || "universal",
      message: ErrorMessages.invalidIdentity,
    });
  }
  return resolveUniversalHandle(identity, platform, headers, false);
}

export const runtime = "edge";
