import type { NextRequest } from "next/server";
import { resolveIdentity } from "web3bio-profile-kit/utils";
import {
  getUserHeaders,
  invalidIdentityResponse,
  parseResolvedIdentityHandle,
} from "@/utils/utils";
import { ALLOWED_PLATFORMS, resolveEtherscanHandle } from "./utils";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ handle: string }> },
) {
  const { handle: rawHandle } = await params;
  const { pathname } = req.nextUrl;
  const handle = rawHandle?.trim() ?? "";

  if (!handle) {
    return invalidIdentityResponse(pathname, "");
  }

  const parsedIdentity = parseResolvedIdentityHandle(resolveIdentity(handle));
  if (!parsedIdentity) {
    return invalidIdentityResponse(pathname, handle);
  }
  const [platform, identity] = parsedIdentity;

  if (!ALLOWED_PLATFORMS.has(platform)) {
    return invalidIdentityResponse(pathname, handle, platform);
  }

  return resolveEtherscanHandle(
    identity,
    platform,
    getUserHeaders(req.headers),
    pathname,
  );
}
