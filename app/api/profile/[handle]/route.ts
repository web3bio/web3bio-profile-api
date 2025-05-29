import { errorHandle, getUserHeaders } from "@/utils/utils";
import { resolveUniversalHandle } from "./utils";
import { resolveIdentity } from "@/utils/base";
import { ErrorMessages, PlatformType } from "web3bio-profile-kit/types";
import type { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const headers = getUserHeaders(req.headers);
  const handle = req.nextUrl.searchParams.get("handle") || "";
  const id = resolveIdentity(handle);

  if (!id) {
    return errorHandle({
      identity: handle,
      code: 404,
      platform: "universal",
      message: ErrorMessages.INVALID_IDENTITY,
    });
  }
  const platform = id.split(",")[0] as PlatformType;
  const identity = id.split(",")[1];

  return resolveUniversalHandle(identity, platform, headers, false);
}

export const runtime = "edge";
