import { NextResponse } from "next/server";
import { isAddress } from "viem";
import { REGEX } from "web3bio-profile-kit/utils";
import { type AuthHeaders, errorHandleProps } from "./types";
import { normalize } from "viem/ens";
import { PlatformType } from "web3bio-profile-kit/types";

export const LENS_PROTOCOL_PROFILE_CONTRACT_ADDRESS =
  "0xDb46d1Dc155634FbC732f92E853b10B288AD5a1d";
export const ARWEAVE_ASSET_PREFIX = "https://arweave.net/";
export const OPENSEA_API_ENDPOINT = "https://api.opensea.io";
export const BASE_URL =
  process.env.NEXT_PUBLIC_PROFILE_END_POINT || "https://api.web3.bio";
export const IDENTITY_GRAPH_SERVER =
  process.env.NEXT_PUBLIC_GRAPHQL_SERVER || "";
export const PLATFORMS_TO_EXCLUDE = [PlatformType.sns, PlatformType.solana];

const web3AddressRegexes = [
  REGEX.ETH_ADDRESS,
  REGEX.CROSSBELL,
  REGEX.BTC_ADDRESS,
  REGEX.SOLANA_ADDRESS,
  REGEX.NEXT_ID,
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

const cacheControl =
  process.env.NODE_ENV === "production"
    ? "public, max-age=21600, s-maxage=86400, stale-while-revalidate=43200"
    : "public, max-age=60, s-maxage=300, stale-while-revalidate=600";

export const respondWithCache = (json: string) => {
  return NextResponse.json(JSON.parse(json), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": cacheControl,
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
    PlatformType.github,
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
  [REGEX.BASENAMES, PlatformType.basenames],
  [REGEX.LINEA, PlatformType.linea],
  [REGEX.ENS, PlatformType.ens],
  [REGEX.ETH_ADDRESS, PlatformType.ethereum],
  [REGEX.LENS, PlatformType.lens],
  [REGEX.UNSTOPPABLE_DOMAINS, PlatformType.unstoppableDomains],
  [REGEX.SPACE_ID, PlatformType.space_id],
  [REGEX.CROSSBELL, PlatformType.crossbell],
  [REGEX.DOTBIT, PlatformType.dotbit],
  [REGEX.SNS, PlatformType.sns],
  [REGEX.GENOME, PlatformType.genome],
  [REGEX.BTC_ADDRESS, PlatformType.bitcoin],
  [REGEX.SOLANA_ADDRESS, PlatformType.solana],
  [REGEX.FARCASTER, PlatformType.farcaster],
  [REGEX.CLUSTER, PlatformType.clusters],
  [REGEX.TWITTER, PlatformType.twitter],
  [REGEX.NEXT_ID, PlatformType.nextid],
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

export const normalizeText = (input?: string): string => {
  if (!input) return "";

  try {
    return normalize(input);
  } catch (error) {
    console.warn("Text normalization failed:", error);
    return input;
  }
};

export const prettify = (input: string): string => {
  if (!input) return "";
  if (input.endsWith(".twitter")) return input.replace(".twitter", "");
  if (input.endsWith(".nextid")) return input.replace(".nextid", "");
  if (input.startsWith("farcaster,#"))
    return input.replace(/^(farcaster),/, "");
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

export const formatTimestamp = (timestamp: number) => {
  return new Date(timestamp * 1000).toISOString();
};
