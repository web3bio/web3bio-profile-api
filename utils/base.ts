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
import { AuthHeaders, errorHandleProps } from "./types";
import { NextRequest, NextResponse } from "next/server";

export const LENS_PROTOCOL_PROFILE_CONTRACT_ADDRESS =
  "0xDb46d1Dc155634FbC732f92E853b10B288AD5a1d";
export const ARWEAVE_ASSET_PREFIX = "https://arweave.net/";
export const SIMPLEHASH_URL = process.env.NEXT_PUBLIC_SIMPLEHASH_PROXY_ENDPOINT;
export const BASE_URL =
  process.env.NEXT_PUBLIC_PROFILE_END_POINT || "https://api.web3.bio";

export const PLATFORMS_TO_EXCLUDE = [PlatformType.sns, PlatformType.solana];

const web3AddressRegexes = [
  regexEth,
  regexCrossbell,
  regexBtc,
  regexSolana,
  regexNext,
];

export const isWeb3Address = (address: string): boolean =>
  web3AddressRegexes.some((regex) => regex.test(address));

export const getUserHeaders = (req: NextRequest): AuthHeaders => {
  let ip = req.headers?.get("x-forwarded-for") || req?.ip;

  if (ip && ip.includes(",")) {
    ip = ip.split(",")[0].trim();
  }
  const header: AuthHeaders = {
    "x-client-ip": ip || "",
  };

  if (process.env.GENERAL_IDENTITY_GRAPH_API_KEY) {
    header.authorization = process.env.GENERAL_IDENTITY_GRAPH_API_KEY;
  }
  const isTrustedDomain =
    req.headers.get("origin")?.includes("web3bio") ||
    req.headers.get("referer")?.includes("web3bio");
  const userToken = req.headers?.get("x-api-key");
  const apiKey =
    userToken && userToken!.length > 0
      ? userToken
      : isTrustedDomain
      ? process.env.WEB3BIO_IDENTITY_GRAPH_API_KEY
      : "";

  if (userToken || isTrustedDomain) {
    console.log(
      `user origin: | ${req.headers.get("origin")} | , user key:| ${req.headers?.get(
        "x-api-key"
      )} |`
    );
  }

  if (apiKey?.length) {
    header.authorization = apiKey;
  }
  return header;
};

export const isSameAddress = (
  address?: string,
  otherAddress?: string
): boolean => {
  if (!address || !otherAddress) return false;
  return address.toLowerCase() === otherAddress.toLowerCase();
};

export const errorHandle = (props: errorHandleProps) => {
  const isValidAddress = isValidEthereumAddress(props.identity || "");
  return NextResponse.json(
    {
      address: isValidAddress ? props.identity : null,
      identity: isValidAddress ? null : props.identity,
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

export const respondWithCache = (json: string) => {
  return NextResponse.json(JSON.parse(json), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, s-maxage=604800, stale-while-revalidate=86400",
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
    return `${string.substring(0, chars + 1)}...${string.substring(
      string.length - (chars + 1)
    )}`;
  }
};

export const isValidEthereumAddress = (address: string) => {
  if (!isAddress(address)) return false; // invalid ethereum address
  if (address.match(/^0x0*.$|0x[123468abef]*$|0x0*dead$/i)) return false; // empty & burn address
  return true;
};

export const shouldPlatformFetch = (platform?: PlatformType | null) => {
  if (!platform) return false;
  return [
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
  ].includes(platform);
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
  if (input.endsWith(".farcaster") || input.endsWith(".fcast.id")) {
    return input.replace(".farcaster", "").replace(".fcast.id", "");
  }
  if (input.endsWith(".base.eth") || input.endsWith(".base")) {
    return input.split(".")[0] + ".base.eth";
  }
  return input;
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
