import { NextResponse } from "next/server";
import { normalize } from "viem/ens";
import { getPlatform, REGEX } from "web3bio-profile-kit/utils";
import { PlatformSystem } from "web3bio-profile-kit/types";
import { type AuthHeaders, errorHandleProps, IdentityRecord } from "./types";

export const LENS_PROTOCOL_PROFILE_CONTRACT_ADDRESS =
  "0xDb46d1Dc155634FbC732f92E853b10B288AD5a1d";
export const ARWEAVE_ASSET_PREFIX = "https://arweave.net/";
export const OPENSEA_API_ENDPOINT = "https://api.opensea.io";
export const BASE_URL =
  process.env.NEXT_PUBLIC_PROFILE_END_POINT || "https://api.web3.bio";
export const IDENTITY_GRAPH_SERVER =
  process.env.NEXT_PUBLIC_GRAPHQL_SERVER || "";

// Cache control constants
const CACHE_CONTROL_PROD =
  "public, max-age=21600, s-maxage=86400, stale-while-revalidate=43200";
const CACHE_CONTROL_DEV =
  "public, max-age=60, s-maxage=300, stale-while-revalidate=600";

export const getUserHeaders = (headers: Headers): AuthHeaders => {
  const userToken = headers?.get("x-api-key");
  return userToken && userToken.length > 0 ? { authorization: userToken } : {};
};

export const errorHandle = ({
  identity = "",
  path,
  platform,
  message,
  code = 500,
  headers = {},
}: errorHandleProps) => {
  return NextResponse.json(
    {
      identity,
      path,
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

export const respondWithCache = (data: any) => {
  const cacheControl =
    process.env.NODE_ENV === "production"
      ? CACHE_CONTROL_PROD
      : CACHE_CONTROL_DEV;

  return NextResponse.json(data, {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": cacheControl,
    },
  });
};

export const formatText = (string: string, length?: number): string => {
  if (!string) return "";

  const len = length ?? 12;
  if (string.length <= len) return string;

  const chars = len / 2 - 2;
  const isHex = string.startsWith("0x");

  if (isHex) {
    return `${string.slice(0, chars + 2)}...${string.slice(-chars)}`;
  } else {
    return `${string.slice(0, chars + 1)}...${string.slice(-(chars + 1))}`;
  }
};

export const normalizeText = (input?: string): string => {
  if (!input) return "";

  let decodedInput: string;
  try {
    decodedInput = decodeURIComponent(input);
  } catch {
    return input;
  }

  return REGEX.EMOJI.test(decodedInput) ? normalize(decodedInput) : input;
};

export const formatTimestamp = (timestamp: number): string => {
  return new Date(timestamp * 1000).toISOString();
};

export const isSingleWeb2Identity = (identity: IdentityRecord): boolean => {
  if (!identity?.identityGraph) return true;

  const platform = getPlatform(identity.platform);
  if (platform?.system !== PlatformSystem.web2) return false;

  const { vertices, edges } = identity.identityGraph;
  return vertices.length === 1 && edges.length === 0;
};
