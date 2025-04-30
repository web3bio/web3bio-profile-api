import { ErrorMessages } from "@/utils/types";
import { errorHandle, getUserHeaders } from "@/utils/utils";
import { NextRequest } from "next/server";
import { resolveUniversalHandle } from "../../profile/[handle]/utils";
import { resolveIdentity } from "@/utils/base";
import { PlatformType } from "@/utils/platform";

export async function GET(req: NextRequest) {
  const headers = getUserHeaders(req.headers);
  const { searchParams } = req.nextUrl;
  const handle = searchParams.get("handle") || "";
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

  return await resolveUniversalHandle(identity, platform, headers, true);
}
export const runtime = "edge";
