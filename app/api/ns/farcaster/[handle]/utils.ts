import { resolveFarcasterHandle } from "@/app/api/profile/farcaster/[handle]/utils";
import { PlatformType } from "@/utils/platform";

export const resolveFarcasterHandleNS = async (handle: string) => {
  const profile = await resolveFarcasterHandle(handle, true);

  return {
    address: profile.address,
    identity: profile.identity,
    platform: PlatformType.farcaster,
    displayName: profile.displayName || profile.identity,
    avatar: profile.avatar,
    description: profile.description,
  };
};
