import { NextResponse } from "next/server";
import { isAddress } from "viem";
import { PlatformType } from "./platform";
import {
  regexBasenames,
  regexBtc,
  regexCluster,
  regexCrossbell,
  regexDotbit,
  regexEns,
  regexEth,
  regexFarcaster,
  regexGenome,
  regexLens,
  regexLinea,
  regexNext,
  regexSns,
  regexSolana,
  regexSpaceid,
  regexTwitter,
  regexUnstoppableDomains,
} from "./regexp";
import { AuthHeaders, errorHandleProps } from "./types";

export const LENS_PROTOCOL_PROFILE_CONTRACT_ADDRESS =
  "0xDb46d1Dc155634FbC732f92E853b10B288AD5a1d";
export const ARWEAVE_ASSET_PREFIX = "https://arweave.net/";
export const SIMPLEHASH_URL = process.env.NEXT_PUBLIC_SIMPLEHASH_PROXY_ENDPOINT;
export const BASE_URL =
  process.env.NEXT_PUBLIC_PROFILE_END_POINT || "https://api.web3.bio";
export const IDENTITY_GRAPH_SERVER =
  process.env.NEXT_PUBLIC_GRAPHQL_SERVER || "";
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

export const getUserHeaders = (headers: Headers): AuthHeaders => {
  const userToken = headers?.get("x-api-key");

  if (userToken && userToken?.length > 0) {
    return {
      authorization: userToken,
    };
  }
  return {};
};

export const isSameAddress = (
  address?: string,
  otherAddress?: string,
): boolean => {
  if (!address || !otherAddress) return false;
  return address.toLowerCase() === otherAddress.toLowerCase();
};

export const errorHandle = ({
  identity = "",
  platform,
  message,
  code = 500,
  headers = {},
}: errorHandleProps) => {
  const isValidAddress = isValidEthereumAddress(identity || "");

  return NextResponse.json(
    {
      address: isValidAddress ? identity : null,
      identity: isValidAddress ? null : identity || null,
      platform,
      error: message,
    },
    {
      status: typeof code === "number" && !isNaN(code) ? code : 500,
      headers: {
        "Cache-Control": "no-store",
        ...headers,
      },
    },
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
      string.length - chars,
    )}`;
  } else {
    return `${string.substring(0, chars + 1)}...${string.substring(
      string.length - (chars + 1),
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
    PlatformType.linea,
    PlatformType.ethereum,
    PlatformType.twitter,
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
  [regexLinea, PlatformType.linea],
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
  [regexNext, PlatformType.nextid],
]);

export const handleSearchPlatform = (term: string) => {
  if (term.endsWith(".farcaster.eth")) return PlatformType.farcaster;
  for (const [regex, platformType] of platformMap) {
    if (regex.test(term)) {
      return platformType;
    }
  }
  return term.includes(".") ? PlatformType.ens : PlatformType.farcaster;
};

export const prettify = (input: string): string => {
  if (!input) return "";
  if (input.endsWith(".twitter")) return input.replace(".twitter", "");
  if (input.endsWith(".nextid")) return input.replace(".nextid", "");
  if (
    input.endsWith(".farcaster") ||
    input.endsWith(".fcast.id") ||
    input.endsWith(".farcaster.eth")
  ) {
    return input.replace(/(\.farcaster|\.fcast\.id|\.farcaster\.eth)$/, "");
  }
  if (input.endsWith(".base") || input.endsWith(".linea")) {
    return input.split(".")[0] + "." + input.split(".").pop() + ".eth";
  }
  return input;
};

export const uglify = (input: string, platform: PlatformType) => {
  if (!input) return "";
  switch (platform) {
    case PlatformType.farcaster:
      return input.endsWith(".farcaster") ||
        input.endsWith(".fcast.id") ||
        input.endsWith(".farcaster.eth")
        ? input
        : `${input}.farcaster`;
    case PlatformType.lens:
      return input.endsWith(".lens") ? input : `${input}.lens`;
    case PlatformType.basenames:
      return input.endsWith(".base.eth")
        ? input
        : input.endsWith(".base")
          ? `${input}.eth`
          : `${input}.base.eth`;
    case PlatformType.linea:
      return input.endsWith(".linea.eth")
        ? input
        : input.endsWith(".linea")
          ? `${input}.eth`
          : `${input}.linea.eth`;
    default:
      return input;
  }
};
