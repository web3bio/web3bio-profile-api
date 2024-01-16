import { isAddress } from "viem";
import { PlatformType } from "./platform";

export type LinksItem = {
  link: string | null;
  handle: string | null;
};

interface errorHandleProps {
  identity: string | null;
  code: number;
  message: ErrorMessages | string;
  platform: PlatformType | null;
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
  const isValidAddress = isValidEthereumAddress(props.identity || "");
  return new Response(
    JSON.stringify({
      address: isValidAddress ? props.identity : null,
      identity: !isValidAddress ? props.identity : null,
      platform: props.platform,
      error: props.message,
    }),
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
  return new Response(json, {
    status: 200,
    headers: {
      "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=3600",
    },
  });
};

export const formatText = (string: string, length?: number) => {
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

export const isValidEthereumAddress = (address: string) => {
  if (!isAddress(address)) return false; // invalid ethereum address
  if (address.match(/^0x0*.$|0x[123468abef]*$|0x0*dead$/i)) return false; // empty & burn address
  return true;
};
