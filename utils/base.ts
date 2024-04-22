import { isAddress } from "viem";
import { PlatformType } from "./platform";
import {
  regexDotbit,
  regexEns,
  regexEth,
  regexLens,
  regexTwitter,
  regexUnstoppableDomains,
  regexSpaceid,
  regexFarcaster,
  regexAvatar,
} from "./regexp";
import { errorHandleProps } from "./types";

export const errorHandle = (props: errorHandleProps) => {
  const isValidAddress = isValidEthereumAddress(props.identity || "");
  return new Response(
    JSON.stringify({
      address: isValidAddress ? props.identity : null,
      identity: !isValidAddress ? props.identity : null,
      platform: props.platform,
      error: props.message,
    }),
    {
      status: isNaN(props.code) ? 500 : props.code,
      headers: {
        "Cache-Control": "no-store",
        ...props.headers,
      },
    }
  );
};
export const respondWithCache = (json: string) => {
  return new Response(json, {
    status: 200,
    headers: {
      "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=3600",
    },
  });
};

export const formatText = (string: string, length?: number) => {
  if (!string) return "";
  const len = length ?? 12;
  const chars = len / 2 - 2;
  if (string.length <= len) {
    return string;
  }
  if (string.startsWith("0x")) {
    return `${string.substring(0, chars + 2)}...${string.substring(
      string.length - chars
    )}`;
  } else {
    if (string.length > len) {
      return `${string.substring(0, chars + 1)}...${string.substring(
        string.length - (chars + 1)
      )}`;
    }
  }
  return string;
};

export const isValidEthereumAddress = (address: string) => {
  if (!isAddress(address)) return false; // invalid ethereum address
  if (address.match(/^0x0*.$|0x[123468abef]*$|0x0*dead$/i)) return false; // empty & burn address
  return true;
};

export const shouldPlatformFetch = (platform?: PlatformType | null) => {
  if (!platform) return false;
  if (
    [
      PlatformType.ens,
      PlatformType.ethereum,
      PlatformType.farcaster,
      PlatformType.lens,
      PlatformType.unstoppableDomains,
      PlatformType.dotbit,
      PlatformType.nextid,
    ].includes(platform)
  )
    return true;
  return false;
};

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
    case regexAvatar.test(term):
      return PlatformType.nextid;
    default:
      return null;
  }
};

export const isDomainSearch = (term: PlatformType) => {
  return [
    PlatformType.ens,
    PlatformType.dotbit,
    PlatformType.unstoppableDomains,
    PlatformType.space_id,
    PlatformType.lens,
  ].includes(term);
};
