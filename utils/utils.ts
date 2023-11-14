import { PlatformType, PlatformData } from "./platform";
import {
  regexDotbit,
  regexEns,
  regexEth,
  regexLens,
  regexTwitter,
  regexUnstoppableDomains,
  regexSpaceid,
  regexFarcaster,
} from "./regexp";

export const handleSearchPlatform = (term: string) => {
  switch (true) {
    case regexEns.test(term):
      return PlatformType.ens;
    case regexEth.test(term):
      return PlatformType.ethereum;
    case regexLens.test(term):
      return PlatformType.lens;
    case regexUnstoppableDomains.test(term):
      return PlatformType.unstoppableDomains;
    case regexSpaceid.test(term):
      return PlatformType.space_id;
    case regexDotbit.test(term):
      return PlatformType.dotbit;
    case regexTwitter.test(term):
      return PlatformType.twitter;
    case regexFarcaster.test(term):
      return PlatformType.farcaster;
    default:
      return PlatformType.nextid;
  }
};

export const isDomainSearch = (term: PlatformType) => {
  return [
    PlatformType.ens,
    PlatformType.dotbit,
    PlatformType.unstoppableDomains,
    PlatformType.space_id,
  ].includes(term);
};

export const SocialPlatformMapping = (platform: PlatformType) => {
  return (
    PlatformData[platform] ?? {
      key: platform,
      color: "#000000",
      icon: "",
      label: platform,
      ensText: [],
    }
  );
};