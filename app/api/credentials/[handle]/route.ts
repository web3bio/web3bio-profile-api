import { errorHandle, getUserHeaders } from "@/utils/utils";
import type { NextRequest } from "next/server";
import { type Platform, ErrorMessages } from "web3bio-profile-kit/types";
import { resolveIdentity } from "web3bio-profile-kit/utils";
import { resolveCredentialsHandle } from "./utils";

export async function GET(req: NextRequest) {
  const { searchParams, pathname } = req.nextUrl;
  const handle = searchParams.get("handle") || "";

  // Early validation for empty handle
  if (!handle.trim()) {
    return errorHandle({
      identity: handle,
      code: 400,
      path: pathname,
      platform: null,
      message: ErrorMessages.INVALID_IDENTITY,
    });
  }

  // Resolve identity once and validate
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

  // Parse platform and identity from resolved ID
  const [platform, identity] = resolvedId.split(",", 2);

  // Validate both platform and identity exist
  if (!platform || !identity) {
    return errorHandle({
      identity: handle,
      code: 404,
      path: pathname,
      platform: (platform as Platform) || null,
      message: ErrorMessages.INVALID_IDENTITY,
    });
  }

  // Get headers only after validation passes
  const headers = getUserHeaders(req.headers);

  return resolveCredentialsHandle(
    identity,
    platform as Platform,
    headers,
    pathname,
  );
}
