import { resolveFarcasterHandle } from "@/app/api/profile/farcaster/[handle]/utils";
import { PlatformType } from "@/utils/platform";
import { AuthHeaders } from "@/utils/types";

export const resolveFarcasterHandleNS = async (
  handle: string,
  headers: AuthHeaders
) => {
  const profile = await resolveFarcasterHandle(handle, headers, true);
  if (profile.message) {
    return profile;
  } else {
    return {
      address: profile.address,
      identity: profile.identity,
      platform: PlatformType.farcaster,
      displayName: profile.displayName || profile.identity,
      avatar: profile.avatar,
      description: profile.description,
    };
  }
};
