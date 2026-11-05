import type { NextRequest } from "next/server";
import { Platform } from "web3bio-profile-kit/types";
import { REGEX, resolveIdentity } from "web3bio-profile-kit/utils";
import {
  getUserHeaders,
  invalidIdentityResponse,
  parseResolvedIdentityHandle,
} from "@/utils/utils";
import { resolveBadgesHandle } from "./utils";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ handle: string }> },
) {
  const { handle: rawHandle } = await params;
  const { pathname } = req.nextUrl;
  const handle = rawHandle?.trim() ?? "";

  if (!handle) {
    return invalidIdentityResponse(pathname, "", null, 400);
  }

  const parsedIdentity = parseResolvedIdentityHandle(resolveIdentity(handle));
  if (!parsedIdentity) {
    return invalidIdentityResponse(pathname, handle);
  }

  const [platform, identity] = parsedIdentity;
  if (
    ![Platform.lens, Platform.farcaster, Platform.ethereum].includes(platform) ||
    (platform === Platform.ethereum && !REGEX.ETH_ADDRESS.test(identity))
  ) {
    return invalidIdentityResponse(pathname, handle);
  }

  const headers = getUserHeaders(req.headers);
  return resolveBadgesHandle(identity, platform, headers, pathname);
}
