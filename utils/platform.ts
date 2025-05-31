import { DEFAULT_PLATFORM, PLATFORM_DATA } from "web3bio-profile-kit/utils";
import type { Platform, PlatformType } from "web3bio-profile-kit/types";

export const getPlatform = (platform: Platform): Readonly<PlatformType> => {
  return (
    PLATFORM_DATA.get(platform) || { ...DEFAULT_PLATFORM, label: platform }
  );
};
