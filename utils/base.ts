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

interface errorHandleProps {
  address: string | null;
  identity: string | null;
  platform: PlatformType;
  code: number;
  message: ErrorMessages;
  headers?: HeadersInit;
}

export enum ErrorMessages {
  notFound = "Not Found",
  noResolver = "No Resolver Address",
  invalidResolved = "Invalid ResolvedAddress",
  notExist = "Does Not Exist",
  invalidIdentity = "Invalid Identity or Domain",
  invalidAddr = "Invalid Address",
}

export const errorHandle = (props: errorHandleProps) => {
  return new Response(
    JSON.stringify({
      address: props.address,
      identity: props.identity,
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

export const resolve = (from: string, to: string) => {
  const resolvedUrl = new URL(to, new URL(from, "resolve://"));
  if (resolvedUrl.protocol === "resolve:") {
    const { pathname, search, hash } = resolvedUrl;
    return `${pathname}${search}${hash}`;
  }
  return resolvedUrl.toString();
};
