import { errorHandle, ErrorMessages, respondWithCache } from "@/utils/base";
import { CoinType } from "@/utils/cointype";
import { PlatformType } from "@/utils/platform";
import { regexEns, regexEth } from "@/utils/regexp";
import { resolveEipAssetURL } from "@/utils/resolver";
import { getAddress, isAddress } from "ethers/lib/utils";
import { NextApiRequest } from "next";
import {
  getResolverAddressFromName,
  isValidEthereumAddress,
  resolveAddressFromName,
  resolveENSCoinTypesValue,
  resolveENSResponse,
  resolveENSTextValue,
  resolveNameFromAddress,
} from "../../profile/ens/[handle]";

export const resolveENSHandleNS = async (handle: string) => {
  const { address, ensDomain, resolverAddress } = await resolveENSResponse(
    handle
  );

  if (!isValidEthereumAddress(resolverAddress))
    throw new Error(ErrorMessages.invalidResolver, { cause: 404 });

  const avatarHandle =
    (await resolveENSTextValue(resolverAddress, ensDomain, "avatar")) || null;
  const resJSON = {
    address: address.toLowerCase(),
    identity: ensDomain,
    platform: PlatformType.ens,
    displayName:
      (await resolveENSTextValue(resolverAddress, ensDomain, "name")) ||
      ensDomain,
    avatar: avatarHandle ? await resolveEipAssetURL(avatarHandle) : null,

    description:
      (await resolveENSTextValue(resolverAddress, ensDomain, "description")) ||
      null,
  };
  return resJSON;
};

const resolveENSRespondNS = async (handle: string) => {
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
  maxDuration: 45,
  unstable_allowDynamic: [
    "**/node_modules/lodash/**/*.js",
    "**/node_modules/@ensdomain/address-encoder/**/*.js",
    "**/node_modules/js-sha256/**/*.js",
  ],
};
