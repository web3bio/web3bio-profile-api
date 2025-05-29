import { NextResponse } from "next/server";
import { isAddress } from "viem";
import { REGEX } from "web3bio-profile-kit/utils";
import { type AuthHeaders, errorHandleProps } from "./types";
import { normalize } from "viem/ens";
import { Platform } from "web3bio-profile-kit/types";

export const LENS_PROTOCOL_PROFILE_CONTRACT_ADDRESS =
  "0xDb46d1Dc155634FbC732f92E853b10B288AD5a1d";
export const ARWEAVE_ASSET_PREFIX = "https://arweave.net/";
export const OPENSEA_API_ENDPOINT = "https://api.opensea.io";
export const BASE_URL =
  process.env.NEXT_PUBLIC_PROFILE_END_POINT || "https://api.web3.bio";
export const IDENTITY_GRAPH_SERVER =
  process.env.NEXT_PUBLIC_GRAPHQL_SERVER || "";
export const PLATFORMS_TO_EXCLUDE = [Platform.sns, Platform.solana];

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

export const shouldPlatformFetch = (platform?: Platform | null) => {
  if (!platform) return false;
  return [
    Platform.ens,
    Platform.basenames,
    Platform.linea,
    Platform.ethereum,
    Platform.twitter,
    Platform.github,
    Platform.farcaster,
    Platform.lens,
    Platform.unstoppableDomains,
    Platform.nextid,
    Platform.dotbit,
    Platform.solana,
    Platform.sns,
  ].includes(platform);
};

const platformMap = new Map([
  [REGEX.BASENAMES, Platform.basenames],
  [REGEX.LINEA, Platform.linea],
  [REGEX.ENS, Platform.ens],
  [REGEX.ETH_ADDRESS, Platform.ethereum],
  [REGEX.LENS, Platform.lens],
  [REGEX.UNSTOPPABLE_DOMAINS, Platform.unstoppableDomains],
  [REGEX.SPACE_ID, Platform.space_id],
  [REGEX.CROSSBELL, Platform.crossbell],
  [REGEX.DOTBIT, Platform.dotbit],
  [REGEX.SNS, Platform.sns],
  [REGEX.GENOME, Platform.genome],
  [REGEX.BTC_ADDRESS, Platform.bitcoin],
  [REGEX.SOLANA_ADDRESS, Platform.solana],
  [REGEX.FARCASTER, Platform.farcaster],
  [REGEX.CLUSTER, Platform.clusters],
  [REGEX.TWITTER, Platform.twitter],
  [REGEX.NEXT_ID, Platform.nextid],
]);

export const handleSearchPlatform = (term: string) => {
  if (term.endsWith(".farcaster.eth")) return Platform.farcaster;
  for (const [regex, Platform] of platformMap) {
    if (regex.test(term)) {
      return Platform;
    }
  }
  return term.includes(".") ? Platform.ens : Platform.farcaster;
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

export const uglify = (input: string, platform: Platform) => {
  if (!input) return "";
  switch (platform) {
    case Platform.farcaster:
      return input.endsWith(".farcaster") ||
        input.endsWith(".fcast.id") ||
        input.endsWith(".farcaster.eth")
        ? input
        : `${input}.farcaster`;
    case Platform.lens:
      return input.endsWith(".lens") ? input : `${input}.lens`;
    case Platform.basenames:
      return input.endsWith(".base.eth")
        ? input
        : input.endsWith(".base")
          ? `${input}.eth`
          : `${input}.base.eth`;
    case Platform.linea:
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
