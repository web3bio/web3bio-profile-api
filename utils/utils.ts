import { NextRequest, NextResponse } from "next/server";
import { normalize } from "viem/ens";
import { REGEX } from "web3bio-profile-kit/utils";
import { type AuthHeaders, errorHandleProps } from "./types";

export const ARWEAVE_ASSET_PREFIX = "https://arweave.net/";
export const OPENSEA_API_ENDPOINT = "https://api.opensea.io";
export const BASE_URL = process.env.PROFILE_ENDPOINT || "https://api.web3.bio";
export const IMAGE_API_ENDPOINT = "https://images.web3.bio";
export const IDENTITY_GRAPH_SERVER = process.env.GRAPHQL_SERVER || "";

export const getUserHeaders = (headers: Headers): AuthHeaders => {
  const userIP = headers?.get("x-client-ip") || "";
  const userToken = headers?.get("x-api-key");
  const res = {
    "x-client-ip": userIP,
  } as AuthHeaders;
  return userToken && userToken.length > 0
    ? { authorization: userToken, ...res }
    : res;
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

export const respondWithCache = (data: any, shortCache?: boolean) => {
  const CACHE_CONTROL_SHORT =
    "public, max-age=600, s-maxage=600, stale-while-revalidate=43200";
  const CACHE_CONTROL_PROD =
    "public, max-age=3600, s-maxage=3600, stale-while-revalidate=43200";
  const CACHE_CONTROL_DEV =
    "public, max-age=60, s-maxage=60, stale-while-revalidate=600";
  const cacheControl = shortCache
    ? CACHE_CONTROL_SHORT
    : process.env.NODE_ENV === "production"
      ? CACHE_CONTROL_PROD
      : CACHE_CONTROL_DEV;
  const cdnCacheControl = shortCache
    ? "public, s-maxage=60"
    : process.env.NODE_ENV === "production"
      ? "public, s-maxage=3600"
      : "no-cache";

  return NextResponse.json(data, {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": cacheControl,
      "CDN-Cache-Control": cdnCacheControl,
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

export function getClientIP(req: NextRequest): string {
  let ip =
    req.headers.get("x-forwarded-for") ||
    req.headers.get("x-real-ip") ||
    req.headers.get("cf-connecting-ip");
  if (ip && ip.includes(",")) {
    ip = ip.split(",")[0].trim();
  }
  return ip || "unknown";
}
