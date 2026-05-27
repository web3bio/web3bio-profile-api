import type { NextRequest } from "next/server";
import { Platform } from "web3bio-profile-kit/types";
import {
  isValidEthereumAddress,
  isValidSolanaAddress,
  REGEX,
  resolveIdentity,
} from "web3bio-profile-kit/utils";
import {
  getUserHeaders,
  invalidIdentityResponse,
  parseResolvedIdentityHandle,
} from "@/utils/utils";
import { resolveEtherscanHandle } from "./utils";

const ALLOWED_INPUT = new Set([
  Platform.ens,
  Platform.ethereum,
  Platform.solana,
  Platform.sns,
]);

const isAllowedHandle = (handle: string) =>
  REGEX.ENS.test(handle) ||
  isValidEthereumAddress(handle) ||
  REGEX.SNS.test(handle) ||
  isValidSolanaAddress(handle);

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ handle: string }> },
) {
  const { handle: rawHandle } = await params;
  const { pathname } = req.nextUrl;
  const handle = rawHandle?.trim() ?? "";

  if (!handle || !isAllowedHandle(handle)) {
    return invalidIdentityResponse(pathname, handle);
  }

  const parsedIdentity = parseResolvedIdentityHandle(resolveIdentity(handle));
  if (!parsedIdentity) {
    return invalidIdentityResponse(pathname, handle);
  }
  const [platform, identity] = parsedIdentity;

  if (!ALLOWED_INPUT.has(platform)) {
    return invalidIdentityResponse(pathname, handle, platform);
  }

  const headers = getUserHeaders(req.headers);
  return resolveEtherscanHandle(identity, platform, headers, pathname);
}
