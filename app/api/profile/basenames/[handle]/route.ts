import {
  errorHandle,
  isValidEthereumAddress,
  respondWithCache,
  uglify,
} from "@/utils/base";
import { PlatformType } from "@/utils/platform";
import { regexBasenames, regexEth } from "@/utils/regexp";
import { ErrorMessages } from "@/utils/types";
import { NextRequest } from "next/server";
import { resolveENSResponse } from "../../ens/[handle]/utils";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const handle = searchParams.get("handle")?.toLowerCase() || "";
  const inputName = isValidEthereumAddress(handle)
    ? handle
    : uglify(handle, PlatformType.basenames);
  if (!regexBasenames.test(inputName) && !regexEth.test(inputName))
    return errorHandle({
      identity: inputName,
      platform: PlatformType.basenames,
      code: 404,
      message: ErrorMessages.invalidIdentity,
    });
  try {
    const json = await resolveENSResponse(inputName, PlatformType.basenames);
    return respondWithCache(JSON.stringify(json));
  } catch (e: any) {
    return errorHandle({
      identity: inputName,
      platform: PlatformType.basenames,
      code: e.cause || 500,
      message: e.message,
    });
  }
}

export const runtime = "edge";
