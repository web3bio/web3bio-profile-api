import { errorHandle, getUserHeaders, respondWithCache } from "@/utils/base";
import { PlatformType } from "@/utils/platform";
import { regexEns, regexEth } from "@/utils/regexp";
import { ErrorMessages } from "@/utils/types";
import { NextRequest } from "next/server";
import { resolveENSResponse } from "../../ens/[handle]/utils";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const handle = searchParams.get("handle")?.toLowerCase() || "";
  const headers = getUserHeaders(req);
  if (!regexEns.test(handle) && !regexEth.test(handle))
    return errorHandle({
      identity: handle,
      platform: PlatformType.ethereum,
      code: 404,
      message: ErrorMessages.invalidIdentity,
    });
  try {
    const json = await resolveENSResponse(handle, headers);
    return respondWithCache(JSON.stringify(json), headers);
  } catch (e: any) {
    return errorHandle({
      identity: handle,
      platform: PlatformType.ens,
      code: e.cause || 500,
      message: e.message,
    });
  }
}

export const runtime = "edge";
