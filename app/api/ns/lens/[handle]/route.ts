import {
  errorHandle,
  getUserHeaders,
  isValidEthereumAddress,
  prettify,
} from "@/utils/utils";
import { PlatformType } from "@/utils/platform";
import { regexLens } from "@/utils/regexp";
import { ErrorMessages } from "@/utils/types";
import { resolveIdentityHandle } from "@/utils/base";
import type { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const headers = getUserHeaders(req.headers);
  const { searchParams } = req.nextUrl;
  const handle = searchParams.get("handle")?.toLowerCase() || "";

  if (!regexLens.test(handle) && !isValidEthereumAddress(handle)) {
    return errorHandle({
      identity: handle,
      platform: PlatformType.lens,
      code: 404,
      message: ErrorMessages.invalidIdentity,
    });
  }

  return resolveIdentityHandle(
    prettify(handle),
    PlatformType.lens,
    headers,
    true,
  );
}

export const runtime = "edge";
