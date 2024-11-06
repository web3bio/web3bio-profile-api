import { errorHandle, respondWithCache } from "@/utils/base";
import { PlatformType } from "@/utils/platform";
import { resolveENSResponse } from "@/app/api/profile/ens/[handle]/utils";

export const resolveENSRespondNS = async (
  handle: string,
  _platform?: PlatformType
) => {
  try {
    const profile = await resolveENSResponse(handle, _platform, true);

    const json = {
      address: profile.address,
      identity: profile.identity,
      platform: profile.platform,
      displayName: profile.displayName,
      avatar: profile.avatar,
      description: profile.description,
    };
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
