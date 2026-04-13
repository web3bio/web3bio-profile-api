import type { NextRequest } from "next/server";
import { type Platform, ErrorMessages } from "web3bio-profile-kit/types";
import { resolveIdentity } from "web3bio-profile-kit/utils";
import { errorHandle, getUserHeaders, respondJson } from "@/utils/utils";
import { resolveWalletResponse } from "./utils";

const invalidIdentityResponse = (
  pathname: string,
  handle: string,
  platform: Platform | null = null,
) =>
  errorHandle({
    identity: handle,
    code: 404,
    path: pathname,
    platform,
    message: ErrorMessages.INVALID_IDENTITY,
  });

const parseWalletHandle = (
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
  { params }: { params: Promise<{ handle: string }> },
) {
  const { handle: rawHandle } = await params;
  const { pathname } = req.nextUrl;
  const handle = rawHandle?.trim() ?? "";

  if (!handle) {
    return invalidIdentityResponse(pathname, "");
  }

  const parsedIdentity = parseWalletHandle(resolveIdentity(handle));
  if (!parsedIdentity) {
    return invalidIdentityResponse(pathname, handle);
  }
  const [platform, identity] = parsedIdentity;

  const headers = getUserHeaders(req.headers);
  return resolveWalletResponse(
    identity,
    platform as Platform,
    headers,
    pathname,
  );
}
