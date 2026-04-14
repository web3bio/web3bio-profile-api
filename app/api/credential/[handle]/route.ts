import { getUserHeaders } from "@/utils/utils";
import type { NextRequest } from "next/server";
import { resolveIdentity } from "web3bio-profile-kit/utils";
import { resolveCredentialHandle } from "./utils";
import {
  invalidIdentityResponse,
  parseResolvedIdentityHandle,
} from "@/app/api/_shared/identity-route";

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

  const parsedIdentity = parseResolvedIdentityHandle(resolveIdentity(handle));
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
