import {
  errorHandle,
  getUserHeaders,
  isValidEthereumAddress,
  respondWithCache,
} from "@/utils/base";
import { PlatformType } from "@/utils/platform";
import { regexLens } from "@/utils/regexp";
import { AuthHeaders, ErrorMessages } from "@/utils/types";
import { NextRequest } from "next/server";
import { resolveLensHandle } from "./utils";

const resolveLensRespond = async (handle: string, headers: AuthHeaders) => {
  try {
    const json = (await resolveLensHandle(handle, headers)) as any;
    if (json.code) {
      return errorHandle({
        identity: handle,
        platform: PlatformType.lens,
        code: json.code,
        message: json.message,
      });
    }
    return respondWithCache(JSON.stringify(json));
  } catch (e: any) {
    return errorHandle({
      identity: handle,
      platform: PlatformType.lens,
      code: e.cause || 500,
      message: e.message,
    });
  }
};

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const handle = searchParams.get("handle")?.toLowerCase() || "";
  const headers = getUserHeaders(req);
  if (!regexLens.test(handle) && !isValidEthereumAddress(handle))
    return errorHandle({
      identity: handle,
      platform: PlatformType.lens,
      code: 404,
      message: ErrorMessages.invalidIdentity,
    });
  return resolveLensRespond(handle, headers);
}

export const runtime = "edge";
