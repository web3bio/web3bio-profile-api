import { ErrorMessages } from "@/utils/types";
import { errorHandle, getUserHeaders, shouldPlatformFetch } from "@/utils/base";
import { NextRequest } from "next/server";
import {
  resolveUniversalHandle,
  resolveUniversalParams,
} from "../../profile/[handle]/utils";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const headers = getUserHeaders(req);
  const handle = searchParams.get("handle") || "";
  const { identity, platform } = resolveUniversalParams(handle);
  if (!identity || !platform || !shouldPlatformFetch(platform)) {
    return errorHandle({
      identity: identity,
      code: 404,
      platform: platform || "universal",
      message: ErrorMessages.invalidIdentity,
    });
  }
  return await resolveUniversalHandle(identity, platform, headers, true);
}
export const runtime = "edge";
