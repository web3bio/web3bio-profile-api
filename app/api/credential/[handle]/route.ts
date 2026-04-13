import { errorHandle, getUserHeaders } from "@/utils/utils";
import type { NextRequest } from "next/server";
import { type Platform, ErrorMessages } from "web3bio-profile-kit/types";
import { resolveIdentity } from "web3bio-profile-kit/utils";
import { resolveCredentialHandle } from "./utils";

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

const parseCredentialHandle = (
  resolvedIdentity: string | null,
): [Platform, string] | null => {
  if (!resolvedIdentity) {
    return null;
  }

  const [platform, identity] = resolvedIdentity.split(",") as [Platform, string];
  return platform && identity ? [platform, identity] : null;
};

export async function GET(
  req: NextRequest,
  props: { params: Promise<{ handle: string }> },
) {
  const { pathname } = req.nextUrl;
  const { handle: rawHandle } = await props.params;
  const handle = rawHandle?.trim() ?? "";

  if (!handle) {
    return invalidIdentityResponse(pathname, "", null, 400);
  }

  const parsedIdentity = parseCredentialHandle(resolveIdentity(handle));
  if (!parsedIdentity) {
    return invalidIdentityResponse(pathname, handle);
  }
  const [platform, identity] = parsedIdentity;
  const headers = getUserHeaders(req.headers);

  return resolveCredentialHandle(
    identity,
    platform,
    headers,
    pathname,
  );
}
