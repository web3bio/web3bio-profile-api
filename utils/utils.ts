import { NextResponse } from "next/server";
import { normalize } from "viem/ens";
import { isValidEthereumAddress } from "web3bio-profile-kit/utils";
import { Platform } from "web3bio-profile-kit/types";
import { type AuthHeaders, errorHandleProps } from "./types";

export const LENS_PROTOCOL_PROFILE_CONTRACT_ADDRESS =
  "0xDb46d1Dc155634FbC732f92E853b10B288AD5a1d";
export const ARWEAVE_ASSET_PREFIX = "https://arweave.net/";
export const OPENSEA_API_ENDPOINT = "https://api.opensea.io";
export const BASE_URL =
  process.env.NEXT_PUBLIC_PROFILE_END_POINT || "https://api.web3.bio";
export const IDENTITY_GRAPH_SERVER =
  process.env.NEXT_PUBLIC_GRAPHQL_SERVER || "";
export const PLATFORMS_TO_EXCLUDE = [Platform.sns, Platform.solana];

export const getUserHeaders = (headers: Headers): AuthHeaders => {
  const userToken = headers?.get("x-api-key");

  if (userToken && userToken?.length > 0) {
    return {
      authorization: userToken,
    };
  }
  return {};
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

export const normalizeText = (input?: string): string => {
  if (!input) return "";

  try {
    return normalize(input);
  } catch (error) {
    console.warn("Text normalization failed:", error);
    return input;
  }
};

export const formatTimestamp = (timestamp: number) => {
  return new Date(timestamp * 1000).toISOString();
};
