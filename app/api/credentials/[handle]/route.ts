import { errorHandle, getUserHeaders } from "@/utils/utils";
import { ErrorMessages } from "@/utils/types";
import { NextRequest } from "next/server";
import { resolveIdentity } from "@/utils/base";
import { PlatformType } from "@/utils/platform";
import { resolveCredentialsHandle } from "./utils";

export async function GET(req: NextRequest) {
  const headers = getUserHeaders(req.headers);
  const handle = req.nextUrl.searchParams.get("handle") || "";
  const id = resolveIdentity(handle);
  if (!id) {
    return errorHandle({
      identity: handle,
      code: 404,
      platform: "credentials",
      message: ErrorMessages.invalidIdentity,
    });
  }
  const platform = id.split(",")[0] as PlatformType;
  const identity = id.split(",")[1];

  return resolveCredentialsHandle(identity, platform, headers);
}

export const runtime = "edge";
