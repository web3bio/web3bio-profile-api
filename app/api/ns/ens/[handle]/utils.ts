import { errorHandle, respondWithCache } from "@/utils/base";
import { PlatformType } from "@/utils/platform";
import { resolveENSResponse } from "@/app/api/profile/ens/[handle]/utils";
import { AuthHeaders } from "@/utils/types";

export const resolveENSRespondNS = async (
  handle: string,
  headers: AuthHeaders,
  _platform?: PlatformType
) => {
  try {
    const profile = await resolveENSResponse(handle, headers, _platform, true);
    let json = {};
    if ((profile as any).message) {
      json = profile;
    } else {
      json = {
        address: profile.address,
        identity: profile.identity,
        platform: profile.platform,
        displayName: profile.displayName || profile.identity,
        avatar: profile.avatar,
        description: profile.description,
      };
    }

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
