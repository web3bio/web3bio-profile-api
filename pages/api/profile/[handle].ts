import type { NextApiRequest } from "next";
import { errorHandle, ErrorMessages } from "@/utils/base";
import { PlatformType } from "@/utils/platform";
import {
  regexEns,
  regexEth,
  regexLens,
  regexTwitter,
  universalFarcaster,
} from "@/utils/regexp";
import {
  getResolverAddressFromName,
  resolveENSCoinTypesValue,
} from "./ens/[handle]";
import { resolveETHFromLens } from "./lens/[handle]";
import {
  FarcasterQueryParamType,
  FetchFromFarcasterOrigin,
} from "./farcaster/[handle]";

interface RequestInterface extends NextApiRequest {
  nextUrl: {
    origin: string;
  };
}

const respondWithCache = (json: string) => {
  return new Response(json, {
    status: 200,
    headers: {
      "Cache-Control": `public, s-maxage=${
        60 * 60 * 24 * 7
      }, stale-while-revalidate=${60 * 30}`,
    },
  });
};

export const resolveETHFromTwitter = async (twitterHandle: string) => {
  const endPoint = `https://7x16bogxfb.execute-api.us-east-1.amazonaws.com/v1/identity?identity=${twitterHandle}&platform=twitter&size=20&page=1`;
  const response = await fetch(endPoint).then((res) => res.json());
  return response?.records?.find((x: any) => x.sns_handle === twitterHandle)
    ?.web3_addr;
};

export const resolveTwitterFromETH = async (address: string) => {
  const endPoint = `https://twitter-handler-proxy.r2d2.to/v1/relation/handles?wallet=${address}&isVerified=true`;
  const response = await fetch(endPoint).then((res) => res.json());
  return response?.data?.[0];
};

const universalRespond = async ({
  twitter,
  address,
  url,
  handle,
}: {
  twitter: string;
  address: string;
  url: string;
  handle: string;
}) => {
  const obj = await Promise.all([
    fetch(url + `/api/profile/twitter/${twitter}`).then((res) => res.json()),
    fetch(url + `/api/profile/ens/${address}`).then((res) => res.json()),
    fetch(url + `/api/profile/farcaster/${address}`).then((res) => res.json()),
    fetch(url + `/api/profile/lens/${address}`).then((res) => res.json()),
  ])
    .then((responses) => {
      return {
        total: responses.length,
        results: responses,
      };
    })
    .catch((error) => {
      return errorHandle({
        address: null,
        identity: handle,
        code: 500,
        message: error as any,
        platform: PlatformType.nextid,
      });
    });
  return respondWithCache(JSON.stringify(obj));
};

const resolveTwitterResponse = async (
  handle: string,
  req: RequestInterface
) => {
  const ethAddress = await resolveETHFromTwitter(handle);
  return await universalRespond({
    address: ethAddress,
    twitter: handle,
    handle,
    url: req.nextUrl.origin,
  });
};

const resolveETHResponse = async (handle: string, req: RequestInterface) => {
  const twitterHandle = await resolveTwitterFromETH(handle);
  return await universalRespond({
    address: handle,
    twitter: twitterHandle,
    handle,
    url: req.nextUrl.origin,
  });
};

const resolveENSResponse = async (handle: string, req: RequestInterface) => {
  const resolverAddress = await getResolverAddressFromName(handle);
  const ethAddress = await resolveENSCoinTypesValue(
    resolverAddress,
    handle,
    60
  );
  const twitterHandle = await resolveTwitterFromETH(ethAddress);

  return await universalRespond({
    address: ethAddress,
    twitter: twitterHandle,
    handle,
    url: req.nextUrl.origin,
  });
};

const resolveLensResponse = async (handle: string, req: RequestInterface) => {
  const ethAddress = await resolveETHFromLens(handle);
  const twitterHandle = await resolveTwitterFromETH(ethAddress);
  return await universalRespond({
    address: ethAddress,
    twitter: twitterHandle,
    handle,
    url: req.nextUrl.origin,
  });
};

const resolveFarcasterResponse = async (
  handle: string,
  req: RequestInterface
) => {
  const resolvedHandle = handle.replace(".farcaster", "");
  const ethAddress = (
    await FetchFromFarcasterOrigin(
      resolvedHandle,
      FarcasterQueryParamType.username
    )
  )?.[0]?.connectedAddress;
  const twitterHandle = await resolveTwitterFromETH(ethAddress);
  return await universalRespond({
    address: ethAddress,
    twitter: twitterHandle,
    handle,
    url: req.nextUrl.origin,
  });
};

const resolveUniversalHandle = async (
  handle: string,
  req: RequestInterface
) => {
  if (regexEth.test(handle)) {
    return await resolveETHResponse(handle, req);
  }
  if (regexEns.test(handle)) {
    return await resolveENSResponse(handle, req);
  }
  if (regexLens.test(handle)) {
    return await resolveLensResponse(handle, req);
  }
  if (universalFarcaster.test(handle)) {
    return await resolveFarcasterResponse(handle, req);
  }
  if (regexTwitter.test(handle)) {
    return await resolveTwitterResponse(handle, req);
  }

  return errorHandle({
    address: null,
    identity: handle,
    platform: PlatformType.nextid,
    message: ErrorMessages.unknownError,
    code: 500,
  });
};

export default async function handler(req: RequestInterface) {
  const { searchParams } = new URL(req.url as string);
  const inputName = searchParams.get("handle");
  const lowercaseName = inputName?.toLowerCase() || "";
  if (!lowercaseName)
    return errorHandle({
      address: null,
      identity: lowercaseName,
      platform: PlatformType.nextid,
      code: 404,
      message: ErrorMessages.invalidIdentity,
    });
  return resolveUniversalHandle(lowercaseName, req);
}

export const config = {
  runtime: "edge",
  unstable_allowDynamic: [
    "**/node_modules/lodash/**/*.js",
    "**/node_modules/@ensdomain/address-encoder/**/*.js",
    "**/node_modules/js-sha256/**/*.js",
  ],
};
