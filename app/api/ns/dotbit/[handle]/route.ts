import { Platform, ErrorMessages } from "web3bio-profile-kit/types";
import { isValidEthereumAddress, REGEX } from "web3bio-profile-kit/utils";
import { errorHandle, getUserHeaders } from "@/utils/utils";
import { resolveIdentityHandle } from "@/utils/base";
import type { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(req: NextRequest) {
  const headers = getUserHeaders(req.headers);
  const { searchParams, pathname } = req.nextUrl;

  const handle = searchParams.get("handle")?.toLowerCase() || "";

  if (!REGEX.DOTBIT.test(handle) && !isValidEthereumAddress(handle)) {
    return errorHandle({
      identity: handle,
      path: pathname,
      platform: Platform.dotbit,
      code: 404,
      message: ErrorMessages.INVALID_IDENTITY,
    });
  }

  return resolveIdentityHandle(
    handle,
    Platform.dotbit,
    headers,
    true,
    pathname,
  );
}
