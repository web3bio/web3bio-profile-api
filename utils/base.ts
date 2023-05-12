import { NextApiResponse } from "next";
import { PlatformType } from "./platform";

export type LinksItem = {
  link: string | null;
  handle: string | null;
};
export type LinksData = {
  [index: string | Partial<PlatformType>]: LinksItem | undefined;
};
export type AddressesData = {
  eth?: string | null;
  btc?: string | null;
  ltc?: string | null;
  doge?: string | null;
  matic?: string | null;
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
  addresses: AddressesData | null;
  error?: string;
};

export type HandleNotFoundResponseData = {
  identity: string | null;
  error: string;
};

export const errorHandle = (handle: string) => {
  return new Response(
    JSON.stringify({
      identity: handle,
      error: "No results",
    }),
    {
      status: 404,
    }
  );
};

export const resolve = (from: string, to: string) => {
  const resolvedUrl = new URL(to, new URL(from, "resolve://"));
  if (resolvedUrl.protocol === "resolve:") {
    const { pathname, search, hash } = resolvedUrl;
    return `${pathname}${search}${hash}`;
  }
  return resolvedUrl.toString();
};
