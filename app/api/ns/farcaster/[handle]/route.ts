import {
  errorHandle,
  getUserHeaders,
  isValidEthereumAddress,
  prettify,
} from "@/utils/base";
import { PlatformType } from "@/utils/platform";
import { regexFarcaster, regexSolana } from "@/utils/regexp";
import { ErrorMessages } from "@/utils/types";
import { NextRequest } from "next/server";
import { resolveIdentityHandle } from "@/utils/utils";

export async function GET(req: NextRequest) {
  const headers = getUserHeaders(req.headers);
  const { searchParams } = req.nextUrl;
  const handle = searchParams.get("handle") || "";

  const resolvedHandle = regexSolana.test(handle)
    ? handle
    : handle.toLowerCase();

  if (
    ![
      isValidEthereumAddress(resolvedHandle),
      regexSolana.test(resolvedHandle),
      regexFarcaster.test(resolvedHandle),
    ].some((x) => !!x)
  )
    return errorHandle({
      identity: resolvedHandle,
      platform: PlatformType.farcaster,
      code: 404,
      message: ErrorMessages.invalidIdentity,
    });

  const queryInput = prettify(handle);
  return resolveIdentityHandle(
    queryInput,
    PlatformType.farcaster,
    headers,
    true,
  );
}

export const runtime = "edge";
