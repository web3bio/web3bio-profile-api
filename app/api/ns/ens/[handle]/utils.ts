import { resolveEipAssetURL } from "@/utils/resolver";
import { errorHandle, formatText, respondWithCache } from "@/utils/base";
import { PlatformType } from "@/utils/platform";
import {
  resolveENSResponse,
  resolveENSTextValue,
} from "@/app/api/profile/ens/[handle]/utils";

interface ENSProfileData {
  address: string;
  identity: string;
  platform: PlatformType;
  displayName: string;
  avatar: string | null;
  description: string | null;
}

export const resolveENSHandleNS = async (
  handle: string
): Promise<ENSProfileData> => {
  const { address, ensDomain, earlyReturnJSON } = await resolveENSResponse(
    handle
  );

  if (earlyReturnJSON) {
    return {
      address,
      identity: address,
      platform: PlatformType.ethereum,
      displayName: formatText(address),
      avatar: null,
      description: null,
    };
  }

  const [avatarHandle, name, description] = await Promise.all([
    resolveENSTextValue(ensDomain, "avatar"),
    resolveENSTextValue(ensDomain, "name"),
    resolveENSTextValue(ensDomain, "description"),
  ]);

  return {
    address: address.toLowerCase(),
    identity: ensDomain,
    platform: PlatformType.ens,
    displayName: name || ensDomain,
    avatar: avatarHandle ? await resolveEipAssetURL(avatarHandle) : null,
    description: description || null,
  };
};

export const resolveENSRespondNS = async (handle: string) => {
  try {
    const json = await resolveENSHandleNS(handle);
    return respondWithCache(JSON.stringify(json));
  } catch (e: unknown) {
    const error = e as Error;
    return errorHandle({
      identity: handle,
      platform: PlatformType.ens,
      code: (error as any).cause || 500,
      message: error.message,
    });
  }
};
