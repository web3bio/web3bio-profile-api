import type { NextRequest } from "next/server";
import { ErrorMessages, Platform } from "web3bio-profile-kit/types";
import { resolveIdentity } from "web3bio-profile-kit/utils";
import { errorHandle, getUserHeaders } from "@/utils/utils";
import { resolveUniversalHandle } from "./utils";

export async function GET(req: NextRequest) {
  const headers = getUserHeaders(req.headers);
  const { searchParams, pathname } = req.nextUrl;
  const handle = searchParams.get("handle") || "";
  const id = resolveIdentity(handle);
  const platform = id?.split(",")[0] as Platform;
  const identity = id?.split(",")[1];
  if (!platform || !identity) {
    return errorHandle({
      identity: handle,
      code: 404,
      path: pathname,
      platform: platform,
      message: ErrorMessages.INVALID_IDENTITY,
    });
  }

  return resolveUniversalHandle(identity, platform, headers, false, pathname);
}

export const runtime = "edge";
