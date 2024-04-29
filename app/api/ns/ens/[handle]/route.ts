import { errorHandle, formatText, respondWithCache } from "@/utils/base";
import { PlatformType } from "@/utils/platform";
import { regexEns, regexEth } from "@/utils/regexp";
import { resolveEipAssetURL } from "@/utils/resolver";
import { ErrorMessages } from "@/utils/types";
import {
  resolveENSResponse,
  resolveENSTextValue,
} from "@/app/api/profile/ens/[handle]/route";
import { NextRequest } from "next/server";

export const resolveENSHandleNS = async (handle: string) => {
  const { address, ensDomain, earlyReturnJSON } = await resolveENSResponse(
    handle
  );
  if (earlyReturnJSON) {
    return {
      address: address,
      identity: address,
      platform: PlatformType.ethereum,
      displayName: formatText(address),
      avatar: null,
      description: null,
    };
  }

  const avatarHandle = (await resolveENSTextValue(ensDomain, "avatar")) || null;
  const resJSON = {
    address: address.toLowerCase(),
    identity: ensDomain,
    platform: PlatformType.ens,
    displayName: (await resolveENSTextValue(ensDomain, "name")) || ensDomain,
    avatar: avatarHandle ? await resolveEipAssetURL(avatarHandle) : null,

    description: (await resolveENSTextValue(ensDomain, "description")) || null,
  };
  return resJSON;
};

export const resolveENSRespondNS = async (handle: string) => {
  try {
    const json = await resolveENSHandleNS(handle);
    return respondWithCache(JSON.stringify(json));
  } catch (e: any) {
    return errorHandle({
      identity: handle,
      platform: PlatformType.ens,
      code: e.cause || 500,
      message: e.message,
    });
  }
};
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const inputName = searchParams.get("handle") || "";
  const lowercaseName = inputName?.toLowerCase();
  if (!regexEns.test(lowercaseName) && !regexEth.test(lowercaseName))
    return errorHandle({
      identity: lowercaseName,
      platform: PlatformType.ens,
      code: 404,
      message: ErrorMessages.invalidIdentity,
    });
  return resolveENSRespondNS(lowercaseName);
}

export const runtime = "edge";
export const preferredRegion = ["sfo1", "iad1", "pdx1"];
