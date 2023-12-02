import { isAddress } from "ethers/lib/utils";
import { PlatformType } from "./platform";

export type LinksItem = {
  link: string | null;
  handle: string | null;
};
export type LinksData = {
  [index: string | Partial<PlatformType>]: LinksItem | undefined;
};
export type HandleResponseData = {
  owner: string | null;
  identity: string | null;
  displayName: string | null;
  avatar: string | null;
  email: string | null;
  description: string | null;
  location: string | null;
  header: string | null;
  links: LinksData;
  error?: string;
};

export type HandleNotFoundResponseData = {
  identity: string | null;
  error: string;
};

interface errorHandleProps {
  identity: string | null;
  platform: PlatformType;
  code: number;
  message: ErrorMessages | string;
  headers?: HeadersInit;
}

export enum ErrorMessages {
  notFound = "Not Found",
  invalidResolver = "Invalid Resolver Address",
  invalidResolved = "Invalid Resolved Address",
  notExist = "Does Not Exist",
  invalidIdentity = "Invalid Identity or Domain",
  invalidAddr = "Invalid Address",
  unknownError = "Unknown Error Occurs",
}

export const errorHandle = (props: errorHandleProps) => {
  const _isAddress = isAddress(props.identity || "");
  return new Response(
    JSON.stringify({
      address: _isAddress ? props.identity : null,
      identity: !_isAddress ? props.identity : null,
      platform: props.platform,
      error: props.message,
    }),
    {
      status: props.code,
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

export const formatText = (string:string, length?: number) => {
  if (!string) return "";
  const len = length ?? 12;
  if (string.length <= len) {
    return string;
  }
  if (string.startsWith("0x") && string.length >= 42) {
    const oriAddr = string,
      chars = length || 4;
    return `${oriAddr.substring(0, chars + 2)}...${oriAddr.substring(
      oriAddr.length - chars
    )}`;
  } else {
    if (string.length > len) {
      return `${string.substr(0, len)}...`;
    }
  }
  return string;
};