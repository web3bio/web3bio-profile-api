import {
  errorHandle,
  getUserHeaders,
  isValidEthereumAddress,
  respondWithCache,
  uglify,
} from "@/utils/base";
import { PlatformType } from "@/utils/platform";
import { regexEth, regexLinea } from "@/utils/regexp";
import { ErrorMessages } from "@/utils/types";
import { NextRequest } from "next/server";
import { resolveENSResponse } from "../../ens/[handle]/utils";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const handle = searchParams.get("handle")?.toLowerCase() || "";
  const headers = getUserHeaders(req);
  const inputName = isValidEthereumAddress(handle)
    ? handle
    : uglify(handle, PlatformType.linea);
  if (!regexLinea.test(inputName) && !regexEth.test(inputName))
    return errorHandle({
      identity: inputName,
      platform: PlatformType.linea,
      code: 404,
      message: ErrorMessages.invalidIdentity,
    });
  try {
    const json = await resolveENSResponse(
      inputName,
      headers,
      PlatformType.linea
    );
    if (json.code) {
      return errorHandle({
        identity: handle,
        platform: PlatformType.linea,
        code: json.code,
        message: json.message,
      });
    }
    return respondWithCache(JSON.stringify(json));
  } catch (e: any) {
    return errorHandle({
      identity: inputName,
      platform: PlatformType.linea,
      code: e.cause || 500,
      message: e.message,
    });
  }
}

export const runtime = "edge";
