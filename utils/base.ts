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
  regexBasenames,
  regexGenome,
  regexCluster,
  regexNext,
} from "./regexp";
import { errorHandleProps } from "./types";
import { NextRequest, NextResponse } from "next/server";

export const LENS_PROTOCOL_PROFILE_CONTRACT_ADDRESS =
  "0xDb46d1Dc155634FbC732f92E853b10B288AD5a1d";
export const ARWEAVE_ASSET_PREFIX = "https://arweave.net/";
export const SIMPLEHASH_URL = process.env.NEXT_PUBLIC_SIMPLEHASH_PROXY_ENDPOINT;
export const BASE_URL =
  process.env.NEXT_PUBLIC_PROFILE_END_POINT || "https://api.web3.bio";

export const PLATFORMS_TO_EXCLUDE = [
  PlatformType.dotbit,
  PlatformType.sns,
  PlatformType.solana,
];

const web3AddressRegexes = [
  regexEth,
  regexCrossbell,
  regexBtc,
  regexSolana,
  regexNext,
];

export function isWeb3Address(address: string): boolean {
  return web3AddressRegexes.some((regex) => regex.test(address));
}

export function getUserHeaders(req: NextRequest) {
  let ip = req.headers?.get("x-forwarded-for") || req?.ip;

  if (ip && ip.includes(",")) {
    ip = ip.split(",")[0].trim();
  }

  const isTrustedDomain =
    req.headers.get("host")?.includes("web3.bio") ||
    req.headers.get("origin")?.includes("web3.bio");

  const apiKey = req.headers?.get("authorization")
    ? req.headers.get("authorization")
    : isTrustedDomain
    ? process.env.NEXT_PUBLIC_IDENTITY_GRAPH_API_KEY
    : "";

  return {
    "x-client-ip": ip || "",
    authorization: apiKey || "",
  };
}

export function isSameAddress(
  address?: string | undefined,
  otherAddress?: string | undefined
): boolean {
  if (!address || !otherAddress) return false;
  return address.toLowerCase() === otherAddress.toLowerCase();
}
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
      "Cache-Control": "public, s-maxage=604800, stale-while-revalidate=86400",
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
      PlatformType.basenames,
      PlatformType.ethereum,
      PlatformType.farcaster,
      PlatformType.lens,
      PlatformType.unstoppableDomains,
      PlatformType.nextid,
      PlatformType.dotbit,
      PlatformType.solana,
      PlatformType.sns,
    ].includes(platform)
  )
    return true;
  return false;
};

const platformMap = new Map([
  [regexBasenames, PlatformType.basenames],
  [regexEns, PlatformType.ens],
  [regexEth, PlatformType.ethereum],
  [regexLens, PlatformType.lens],
  [regexUnstoppableDomains, PlatformType.unstoppableDomains],
  [regexSpaceid, PlatformType.space_id],
  [regexCrossbell, PlatformType.crossbell],
  [regexDotbit, PlatformType.dotbit],
  [regexSns, PlatformType.sns],
  [regexGenome, PlatformType.genome],
  [regexBtc, PlatformType.bitcoin],
  [regexSolana, PlatformType.solana],
  [regexFarcaster, PlatformType.farcaster],
  [regexCluster, PlatformType.clusters],
  [regexTwitter, PlatformType.twitter],
]);

export const handleSearchPlatform = (term: string) => {
  for (const [regex, platformType] of platformMap) {
    if (regex.test(term)) {
      return platformType;
    }
  }
  return term.includes(".") ? PlatformType.ens : PlatformType.farcaster;
};

export const prettify = (input: string) => {
  if (!input) return "";
  switch (!!input) {
    case input.endsWith(".farcaster") || input.endsWith(".fcast.id"):
      return input.replace(".farcaster", "").replace(".fcast.id", "");
    case input.endsWith(".base.eth") || input.endsWith(".base"):
      return input.split(".")[0] + ".base.eth";
    default:
      return input;
  }
};

export const uglify = (input: string, platform: PlatformType) => {
  if (!input) return "";
  switch (platform) {
    case PlatformType.basenames:
      return input.endsWith(".base")
        ? `${input}.eth`
        : input.endsWith(".base.eth")
        ? input
        : `${input}.base.eth`;
    case PlatformType.farcaster:
      return input.endsWith(".farcaster") ? input : `${input}.farcaster`;
    default:
      return input;
  }
};
