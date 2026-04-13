import type { NextRequest } from "next/server";
import { ErrorMessages, Platform } from "web3bio-profile-kit/types";
import { resolveIdentity } from "web3bio-profile-kit/utils";
import { errorHandle, getUserHeaders } from "@/utils/utils";
import { resolveDomainQuery, VALID_DOMAIN_PLATFORMS } from "./utils";

const invalidIdentityResponse = (
  pathname: string,
  handle: string,
  platform: Platform | null = null,
  code = 404,
) =>
  errorHandle({
    identity: handle,
    code,
    path: pathname,
    platform,
    message: ErrorMessages.INVALID_IDENTITY,
  });

const parseDomainHandle = (
  resolvedIdentity: string | null,
): [Platform, string] | null => {
  if (!resolvedIdentity) {
    return null;
  }

  const [platform, identity] = resolvedIdentity.split(",") as [Platform, string];
  if (!platform || !identity || !VALID_DOMAIN_PLATFORMS.has(platform)) {
    return null;
  }

  return [platform, identity];
};

export async function GET(
  req: NextRequest,
  props: { params: Promise<{ handle: string }> },
) {
  const { handle: rawHandle } = await props.params;
  const { pathname } = req.nextUrl;
  const handle = rawHandle?.trim() ?? "";

  if (!handle) {
    return invalidIdentityResponse(pathname, "", null, 400);
  }

  const parsedIdentity = parseDomainHandle(resolveIdentity(handle));
  if (!parsedIdentity) {
    return invalidIdentityResponse(pathname, handle);
  }

  const [platform, identity] = parsedIdentity;

  const headers = getUserHeaders(req.headers);
  return resolveDomainQuery(identity, platform, headers, pathname);
}
