import type { NextRequest } from "next/server";
import { Platform } from "web3bio-profile-kit/types";
import { resolveIdentity } from "web3bio-profile-kit/utils";
import { getUserHeaders } from "@/utils/utils";
import { resolveDomainQuery, VALID_DOMAIN_PLATFORMS } from "./utils";
import {
  invalidIdentityResponse,
  parseResolvedIdentityHandle,
} from "@/app/api/_shared/identity-route";

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

  const parsedIdentity = parseResolvedIdentityHandle(resolveIdentity(handle));
  if (!parsedIdentity || !VALID_DOMAIN_PLATFORMS.has(parsedIdentity[0])) {
    return invalidIdentityResponse(pathname, handle);
  }

  const [platform, identity] = parsedIdentity;

  const headers = getUserHeaders(req.headers);
  return resolveDomainQuery(identity, platform, headers, pathname);
}
