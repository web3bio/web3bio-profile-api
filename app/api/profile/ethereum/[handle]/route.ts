import type { NextRequest } from "next/server";
import { ErrorMessages, Platform } from "web3bio-profile-kit/types";
import { isValidEthereumAddress, REGEX } from "web3bio-profile-kit/utils";
import { resolveIdentityHandle } from "@/utils/base";
import { errorHandle, getUserHeaders } from "@/utils/utils";

export async function GET(
  req: NextRequest,
  props: { params: Promise<{ handle: string }> },
) {
  const params = await props.params;
  const { pathname } = req.nextUrl;
  const handle = params.handle?.toLowerCase() || "";

  if (!REGEX.ENS.test(handle) && !isValidEthereumAddress(handle))
    return errorHandle({
      identity: handle,
      path: pathname,
      platform: Platform.ethereum,
      code: 404,
      message: ErrorMessages.INVALID_IDENTITY,
    });

  const headers = getUserHeaders(req.headers);
  return resolveIdentityHandle(handle, Platform.ens, headers, false, pathname);
}
