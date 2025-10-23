import type { NextRequest } from "next/server";
import { ErrorMessages, Platform } from "web3bio-profile-kit/types";
import {
  isValidEthereumAddress,
  REGEX,
  uglify,
} from "web3bio-profile-kit/utils";
import { resolveIdentityHandle } from "@/utils/base";
import { errorHandle, getUserHeaders } from "@/utils/utils";

type RouteParams = {
  params: Promise<{
    handle: string;
  }>;
};

export async function GET(req: NextRequest, { params }: RouteParams) {
  const { handle: inputName } = await params;
  const { pathname } = req.nextUrl;
  const isEthAddress = isValidEthereumAddress(inputName);

  const handle = isEthAddress
    ? inputName.toLowerCase()
    : uglify(inputName, Platform.linea);

  if (!REGEX.LINEA.test(handle) && !isEthAddress)
    return errorHandle({
      identity: handle,
      path: pathname,
      platform: Platform.linea,
      code: 404,
      message: ErrorMessages.INVALID_IDENTITY,
    });

  const headers = getUserHeaders(req.headers);
  return resolveIdentityHandle(handle, Platform.linea, headers, true, pathname);
}
