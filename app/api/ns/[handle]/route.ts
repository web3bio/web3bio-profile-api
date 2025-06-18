import type { NextRequest } from "next/server";
import { type Platform, ErrorMessages } from "web3bio-profile-kit/types";
import { resolveIdentity } from "web3bio-profile-kit/utils";
import { resolveUniversalHandle } from "../../profile/[handle]/utils";
import { errorHandle, getUserHeaders } from "@/utils/utils";

export async function GET(req: NextRequest) {
  const { searchParams, pathname } = req.nextUrl;
  const handle = searchParams.get("handle");

  // Early validation
  if (!handle) {
    return errorHandle({
      identity: "",
      code: 400,
      path: pathname,
      platform: null,
      message: "Missing handle parameter",
    });
  }

  // Parse identity
  const resolvedId = resolveIdentity(handle);
  if (!resolvedId) {
    return errorHandle({
      identity: handle,
      code: 404,
      path: pathname,
      platform: null,
      message: ErrorMessages.INVALID_IDENTITY,
    });
  }

  const [platform, identity] = resolvedId.split(",", 2);

  // Validate parsed data
  if (!platform || !identity) {
    return errorHandle({
      identity: handle,
      code: 404,
      path: pathname,
      platform: platform as Platform,
      message: ErrorMessages.INVALID_IDENTITY,
    });
  }

  // Get headers and resolve
  const headers = getUserHeaders(req.headers);

  return resolveUniversalHandle(
    identity,
    platform as Platform,
    headers,
    true, // ns = true
    pathname,
  );
}

export const runtime = "edge";
