import type { NextRequest } from "next/server";
import { ErrorMessages, Platform } from "web3bio-profile-kit/types";
import {
  isValidEthereumAddress,
  REGEX,
  uglify,
} from "web3bio-profile-kit/utils";
import { resolveIdentityHandle } from "@/utils/base";
import { errorHandle, getUserHeaders } from "@/utils/utils";

export async function GET(
  req: NextRequest,
  { params }: { params: { handle: string } },
) {
  const { pathname } = req.nextUrl;
  const inputName = params.handle?.toLowerCase() || "";
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
  return resolveIdentityHandle(
    handle,
    Platform.linea,
    headers,
    false,
    pathname,
  );
}

export const runtime = "edge";
