import {
  type PlatformType,
  type SocialPlatform,
  DEFAULT_PLATFORM,
  PLATFORM_DATA,
} from "web3bio-profile-kit";

export const SocialPlatformMapping = (
  platform: PlatformType,
): Readonly<SocialPlatform> => {
  return (
    PLATFORM_DATA.get(platform) || { ...DEFAULT_PLATFORM, label: platform }
  );
};
