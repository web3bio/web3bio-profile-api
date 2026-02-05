import type { NextRequest } from "next/server";
import { type Platform, ErrorMessages } from "web3bio-profile-kit/types";
import { resolveIdentity } from "web3bio-profile-kit/utils";
import { errorHandle, getUserHeaders } from "@/utils/utils";
import { resolveWalletResponse } from "./utils";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ handle: string }> },
) {
  const { handle } = await params;
  const { pathname } = req.nextUrl;

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

  const [platform, identity] = resolvedId.split(",");

  if (!platform || !identity) {
    return errorHandle({
      identity: handle,
      code: 404,
      path: pathname,
      platform: platform as Platform,
      message: ErrorMessages.INVALID_IDENTITY,
    });
  }

  const headers = getUserHeaders(req.headers);
  return resolveWalletResponse(
    identity,
    platform as Platform,
    headers,
    pathname,
  );
}
