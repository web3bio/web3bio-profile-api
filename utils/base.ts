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
  regexCrossbell,
  regexSns,
  regexBtc,
  regexSolana,
} from "./regexp";
import { errorHandleProps } from "./types";
import { NextResponse } from "next/server";

export const errorHandle = (props: errorHandleProps) => {
  const isValidAddress = isValidEthereumAddress(props.identity || "");
  return NextResponse.json(
    {
      address: isValidAddress ? props.identity : null,
      identity: !isValidAddress ? props.identity : null,
      platform: props.platform,
      error: props.message,
    },
    {
      status: isNaN(props.code) ? 500 : props.code,
      headers: {
        "Cache-Control": "no-store",
        ...props.headers,
      },
    }
  );
};
export const respondWithCache = (
  json: string,
  headers?: { [index: string]: string }
) => {
  return NextResponse.json(JSON.parse(json), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, s-maxage=604800, stale-while-revalidate, stale-if-error=86400",
      ...headers,
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
      PlatformType.solana,
      PlatformType.sns,
    ].includes(platform)
  )
    return true;
  return false;
};

export const handleSearchPlatform = (term: string) => {
  switch (!!term) {
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
    case regexCrossbell.test(term):
      return PlatformType.crossbell;
    case regexDotbit.test(term):
      return PlatformType.dotbit;
    case regexSns.test(term):
      return PlatformType.sns;
    case regexBtc.test(term):
      return PlatformType.bitcoin;
    case regexSolana.test(term):
      return PlatformType.solana;
    case regexTwitter.test(term):
      return PlatformType.twitter;
    case regexFarcaster.test(term):
      return PlatformType.farcaster;
    default:
      return PlatformType.nextid;
  }
};
