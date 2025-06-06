import { errorHandle, getUserHeaders } from "@/utils/utils";
import type { NextRequest } from "next/server";
import { type Platform, ErrorMessages } from "web3bio-profile-kit/types";
import { resolveIdentity } from "web3bio-profile-kit/utils";
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
      message: ErrorMessages.INVALID_IDENTITY,
    });
  }
  const platform = id.split(",")[0] as Platform;
  const identity = id.split(",")[1];

  return resolveCredentialsHandle(identity, platform, headers);
}

export const runtime = "edge";
