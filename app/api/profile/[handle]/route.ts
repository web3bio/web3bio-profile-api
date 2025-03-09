import { errorHandle, getUserHeaders } from "@/utils/base";
import { ErrorMessages } from "@/utils/types";
import { NextRequest } from "next/server";
import { resolveUniversalHandle } from "./utils";
import { resolveIdentity } from "@/utils/utils";
import { PlatformType } from "@/utils/platform";

export async function GET(req: NextRequest) {
  const headers = getUserHeaders(req.headers);
  const handle = req.nextUrl.searchParams.get("handle") || "";
  const id = resolveIdentity(handle);

  if (!id) {
    return errorHandle({
      identity: handle,
      code: 404,
      platform: "universal",
      message: ErrorMessages.invalidIdentity,
    });
  }
  const platform = id.split(",")[0] as PlatformType;
  const identity = id.split(",")[1];

  return resolveUniversalHandle(identity, platform, headers, false);
}

export const runtime = "edge";
