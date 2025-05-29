import {
  errorHandle,
  getUserHeaders,
  isValidEthereumAddress,
} from "@/utils/utils";
import { PlatformType, ErrorMessages } from "web3bio-profile-kit/types";
import { REGEX } from "web3bio-profile-kit/utils";
import { resolveIdentityHandle } from "@/utils/base";
import type { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const headers = getUserHeaders(req.headers);
  const { searchParams } = req.nextUrl;
  const handle = searchParams.get("handle")?.toLowerCase() || "";

  if (!REGEX.ENS.test(handle) && !isValidEthereumAddress(handle))
    return errorHandle({
      identity: handle,
      platform: PlatformType.ens,
      code: 404,
      message: ErrorMessages.INVALID_IDENTITY,
    });
  return resolveIdentityHandle(handle, PlatformType.ens, headers, true);
}

export const runtime = "edge";
