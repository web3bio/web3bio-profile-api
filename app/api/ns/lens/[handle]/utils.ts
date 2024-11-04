import { resolveLensHandle } from "@/app/api/profile/lens/[handle]/utils";
import { PlatformType } from "@/utils/platform";

export const resolveLensHandleNS = async (handle: string) => {
  const profile = await resolveLensHandle(handle, true);

  return {
    address: profile.address,
    identity: profile.identity,
    platform: PlatformType.lens,
    displayName: profile.displayName,
    avatar: profile.avatar,
    description: profile.description,
  };
};
