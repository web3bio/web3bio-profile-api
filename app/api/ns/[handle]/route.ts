import type { NextRequest } from "next/server";
import { resolveIdentity } from "web3bio-profile-kit/utils";
import { resolveUniversalHandle } from "../../profile/[handle]/utils";
import {
  getUserHeaders,
  invalidIdentityResponse,
  parseResolvedIdentityHandle,
} from "@/utils/utils";

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

  const headers = getUserHeaders(req.headers);
  return resolveUniversalHandle(
    identity,
    platform,
    headers,
    true,
    pathname,
  );
}
