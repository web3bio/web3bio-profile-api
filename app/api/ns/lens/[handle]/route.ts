import { resolveLensResponse } from "@/app/api/profile/lens/[handle]/route";
import {
  LENS_PROTOCOL_PROFILE_CONTRACT_ADDRESS,
  errorHandle,
  respondWithCache,
} from "@/utils/base";
import { PlatformType } from "@/utils/platform";
import { regexEth, regexLens } from "@/utils/regexp";
import { resolveEipAssetURL } from "@/utils/resolver";
import { ErrorMessages } from "@/utils/types";
import { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(req: NextRequest) {
  const handle = req.nextUrl.searchParams.get("handle")?.toLowerCase() || "";

  if (!regexLens.test(handle) && !regexEth.test(handle)) {
    return errorHandle({
      identity: handle,
      platform: PlatformType.lens,
      code: 404,
      message: ErrorMessages.invalidIdentity,
    });
  }

  try {
    const response = await resolveLensResponse(handle);
    if (!response) throw new Error(ErrorMessages.notFound, { cause: 404 });

    const avatarUri =
      response.metadata?.picture?.raw?.uri ||
      response.metadata?.picture?.optimized?.uri ||
      (await resolveEipAssetURL(
        `eip155:137/erc721:${LENS_PROTOCOL_PROFILE_CONTRACT_ADDRESS}/${parseInt(
          response.id?.slice(2),
          16
        )}`
      ));

    const json = {
      address: response.ownedBy?.address?.toLowerCase(),
      identity: response.handle.localName + ".lens",
      platform: PlatformType.lens,
      displayName:
        response.metadata?.displayName || response.handle.localName + ".lens",
      avatar: (await resolveEipAssetURL(avatarUri)) || null,
      description: response.metadata?.bio || null,
    };

    return respondWithCache(JSON.stringify(json));
  } catch (e: any) {
    return errorHandle({
      identity: handle,
      platform: PlatformType.lens,
      code: e.cause || 500,
      message: e.message,
    });
  }
}
