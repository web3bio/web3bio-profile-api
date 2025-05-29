import {
  errorHandle,
  getUserHeaders,
  isValidEthereumAddress,
} from "@/utils/utils";
import { Platform, ErrorMessages } from "web3bio-profile-kit/types";
import { resolveIdentityHandle } from "@/utils/base";
import type { NextRequest } from "next/server";
import { REGEX } from "web3bio-profile-kit/utils";

export async function GET(req: NextRequest) {
  const headers = getUserHeaders(req.headers);
  const { searchParams } = req.nextUrl;
  const handle = searchParams.get("handle")?.toLowerCase() || "";

  if (!REGEX.ENS.test(handle) && !isValidEthereumAddress(handle))
    return errorHandle({
      identity: handle,
      platform: Platform.ens,
      code: 404,
      message: ErrorMessages.INVALID_IDENTITY,
    });

  return resolveIdentityHandle(handle, Platform.ens, headers, false);
}

export const runtime = "edge";
