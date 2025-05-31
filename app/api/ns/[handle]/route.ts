import { errorHandle, getUserHeaders } from "@/utils/utils";
import type { NextRequest } from "next/server";
import { type Platform, ErrorMessages } from "web3bio-profile-kit/types";
import { resolveIdentity } from "web3bio-profile-kit/utils";
import { resolveUniversalHandle } from "../../profile/[handle]/utils";

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
      message: ErrorMessages.INVALID_IDENTITY,
    });
  }
  const platform = id.split(",")[0] as Platform;
  const identity = id.split(",")[1];

  return await resolveUniversalHandle(identity, platform, headers, true);
}
export const runtime = "edge";
