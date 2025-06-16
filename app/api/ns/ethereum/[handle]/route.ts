import { resolveIdentityHandle } from "@/utils/base";
import { errorHandle, getUserHeaders } from "@/utils/utils";
import type { NextRequest } from "next/server";
import { ErrorMessages, Platform } from "web3bio-profile-kit/types";
import { isValidEthereumAddress, REGEX } from "web3bio-profile-kit/utils";

export async function GET(req: NextRequest) {
  const headers = getUserHeaders(req.headers);
  const { searchParams, pathname } = req.nextUrl;
  const handle = searchParams.get("handle")?.toLowerCase() || "";

  if (!REGEX.ENS.test(handle) && !isValidEthereumAddress(handle))
    return errorHandle({
      identity: handle,
      path: pathname,
      platform: Platform.ethereum,
      code: 404,
      message: ErrorMessages.INVALID_IDENTITY,
    });
  return resolveIdentityHandle(handle, Platform.ens, headers, true, pathname);
}

export const runtime = "edge";
