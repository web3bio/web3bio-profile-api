import {
  errorHandle,
  ErrorMessages,
  formatText,
  respondWithCache,
} from "@/utils/base";
import { PlatformType } from "@/utils/platform";
import { regexEns, regexEth } from "@/utils/regexp";
import { resolveEipAssetURL } from "@/utils/resolver";
import { NextApiRequest } from "next";
import {
  resolveENSResponse,
  resolveENSTextValue,
} from "../../profile/ens/[handle]";

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
export default async function handler(req: NextApiRequest) {
  const { searchParams } = new URL(req.url as string);
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

export const config = {
  runtime: "edge",
  regions: ["sfo1", "hnd1", "sin1"],
};
