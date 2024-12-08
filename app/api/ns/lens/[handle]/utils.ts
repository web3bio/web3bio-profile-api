import { resolveLensHandle } from "@/app/api/profile/lens/[handle]/utils";
import { PlatformType } from "@/utils/platform";
import { AuthHeaders } from "@/utils/types";

export const resolveLensHandleNS = async (
  handle: string,
  headers: AuthHeaders
) => {
  const profile = (await resolveLensHandle(handle, headers, true)) as any;
  if (profile?.code || profile?.message) {
    return profile;
  }
  return {
    address: profile.address,
    identity: profile.identity,
    platform: PlatformType.lens,
    displayName: profile.displayName || profile.identity,
    avatar: profile.avatar,
    description: profile.description,
  };
};
