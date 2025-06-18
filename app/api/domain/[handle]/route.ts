import type { NextRequest } from "next/server";
import { ErrorMessages, Platform } from "web3bio-profile-kit/types";
import { resolveIdentity } from "web3bio-profile-kit/utils";
import { errorHandle, getUserHeaders } from "@/utils/utils";
import { resolveDomainQuery } from "./utils";

export async function GET(
  req: NextRequest,
  { params }: { params: { handle: string } },
) {
  const { pathname } = req.nextUrl;
  const handle = params.handle;

  // Early validation
  if (!handle) {
    return errorHandle({
      identity: "",
      code: 400,
      path: pathname,
      platform: null,
      message: ErrorMessages.INVALID_IDENTITY,
    });
  }

  // Resolve identity once
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

  // Parse platform and identity
  const [platform, identity] = resolvedId.split(",") as [Platform, string];

  // Validate parsed values
  if (!platform || !identity) {
    return errorHandle({
      identity: handle,
      code: 404,
      path: pathname,
      platform: platform || null,
      message: ErrorMessages.INVALID_IDENTITY,
    });
  }

  // Get headers and resolve domain
  const headers = getUserHeaders(req.headers);
  return resolveDomainQuery(identity, platform, headers, pathname);
}

export const runtime = "edge";
