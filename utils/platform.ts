import { DEFAULT_PLATFORM, PLATFORM_DATA } from "web3bio-profile-kit/utils";
import type { PlatformType, SocialPlatform } from "web3bio-profile-kit/types";

export const SocialPlatformMapping = (
  platform: PlatformType,
): Readonly<SocialPlatform> => {
  return (
    PLATFORM_DATA.get(platform) || { ...DEFAULT_PLATFORM, label: platform }
  );
};
