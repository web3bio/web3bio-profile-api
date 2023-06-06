import type { NextApiRequest } from "next";
import { errorHandle, ErrorMessages } from "@/utils/base";
import { handleSearchPlatform, PlatformType } from "@/utils/platform";
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
import { getRelationQuery } from "@/utils/query";
interface RequestInterface extends NextApiRequest {
  nextUrl: {
    origin: string;
  };
}

const getTranversal = (data: { neighborWithTraversal: any[] }) => {
  return data?.neighborWithTraversal.reduce((pre, cur) => {
    pre.push({
      ...cur.from,
    });
    pre.push({
      ...cur.to,
    });
    return pre;
  }, []);
};

const getTwitterHandleRelation = (
  res: { neighborWithTraversal: any[] },
  platformType: PlatformType
) => {
  return getTranversal(res)?.find((x: any) => x.platform === platformType)
    ?.identity;
};

const nextidGraphQLEndpoint = "https://relation-service.next.id";
// staging
// const nextidGraphQLEndpoint='https://relation-service.nextnext.id'

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

const respondEmpty = () => {
  return new Response(
    JSON.stringify({
      total: 0,
      results: [],
    }),
    {
      status: 404,
      headers: {
        "Cache-Control": "no-store",
      },
    }
  );
};

const universalRespond = async ({
  twitter,
  address,
  url,
  handle,
  fallbackData,
}: {
  twitter: string;
  address: string;
  url: string;
  handle: string;
  fallbackData?: any;
}) => {
  const obj = await Promise.all([
    fetch(url + `/api/profile/twitter/${twitter}`).then((res) => res.json()),
    fetch(url + `/api/profile/ens/${address}`).then((res) => res.json()),
    fallbackData?.farcaster ||
      fetch(url + `/api/profile/farcaster/${address}`).then((res) =>
        res.json()
      ),
    fallbackData?.lens ||
      fetch(url + `/api/profile/lens/${address}`).then((res) => res.json()),
  ])
    .then((responses) => {
      const _res = responses.filter((x) => !x.error);
      return {
        total: _res.length,
        results: _res,
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
  req: RequestInterface,
  isRelation: boolean
) => {
  const ethAddress = isRelation
    ? getTwitterHandleRelation(
        (await resolveHandleFromRelationService(handle))?.data.identity,
        PlatformType.ethereum
      )
    : await resolveETHFromTwitter(handle);

  return await universalRespond({
    address: ethAddress,
    twitter: handle,
    handle,
    url: req.nextUrl.origin,
  });
};

const resolveHandleFromRelationService = async (
  handle: string,
  platform?: PlatformType
) => {
  const _platform = platform || handleSearchPlatform(handle);
  const query = getRelationQuery(handle);
  const payload = {
    query,
    variables: {
      platform: _platform,
      identity: handle,
    },
  };

  const fetchRes = await fetch(nextidGraphQLEndpoint, {
    method: "POST",
    body: JSON.stringify(payload),
    headers: {
      "Content-Type": "application/json",
    },
  }).then((res) => res.json());
  return fetchRes;
};

const resolveETHResponse = async (
  handle: string,
  req: RequestInterface,
  isRelation: boolean
) => {
  const twitterHandle = isRelation
    ? getTwitterHandleRelation(
        (await resolveHandleFromRelationService(handle)).data.identity,
        PlatformType.twitter
      )
    : await resolveTwitterFromETH(handle);
  return await universalRespond({
    address: handle,
    twitter: twitterHandle,
    handle,
    url: req.nextUrl.origin,
  });
};

const resolveENSResponse = async (
  handle: string,
  req: RequestInterface,
  isRelation: boolean
) => {
  const resolverAddress = await getResolverAddressFromName(handle);
  const ethAddress = isRelation
    ? (await resolveHandleFromRelationService(handle)).data.domain.resolved
        .identity
    : await resolveENSCoinTypesValue(resolverAddress, handle, 60);

  if (!ethAddress) return respondEmpty();
  const twitterHandle = isRelation
    ? getTwitterHandleRelation(
        (await resolveHandleFromRelationService(handle)).data.domain.resolved,
        PlatformType.twitter
      )
    : await resolveTwitterFromETH(ethAddress);

  return await universalRespond({
    address: ethAddress,
    twitter: twitterHandle,
    handle: handle,
    url: req.nextUrl.origin,
  });
};

const resolveLensResponse = async (
  handle: string,
  req: RequestInterface,
  isRelation: boolean
) => {
  const lensResponse = await fetch(
    req.nextUrl.origin + `/api/profile/lens/${handle}`
  ).then((res) => res.json());
  if (!lensResponse?.address) return respondEmpty();
  const twitterHandle = isRelation
    ? getTwitterHandleRelation(
        (await resolveHandleFromRelationService(handle)).data.domain.resolved,
        PlatformType.twitter
      )
    : await resolveTwitterFromETH(lensResponse?.address);

  return await universalRespond({
    address: lensResponse?.address,
    twitter: twitterHandle,
    handle,
    url: req.nextUrl.origin,
    fallbackData: {
      lens: lensResponse,
    },
  });
};

const resolveFarcasterResponse = async (
  handle: string,
  req: RequestInterface,
  isRelation: boolean
) => {
  let ethAddress = "";
  let twitterHandle = "";
  const resolvedHandle = handle.replace(".farcaster", "");
  if (isRelation) {
    const relationRes = (
      await resolveHandleFromRelationService(
        resolvedHandle,
        PlatformType.farcaster
      )
    )?.data?.identity;
    twitterHandle = getTwitterHandleRelation(relationRes, PlatformType.twitter);
    ethAddress = relationRes.ownedBy.identity;
    return await universalRespond({
      address: ethAddress,
      twitter: twitterHandle,
      handle,
      url: req.nextUrl.origin,
    });
  }
  const farcasterResponse = await fetch(
    req.nextUrl.origin + `/api/profile/farcaster/${resolvedHandle}`
  ).then((res) => res.json());
  if (!farcasterResponse?.address) return respondEmpty();
  twitterHandle = await resolveTwitterFromETH(farcasterResponse?.address);
  return await universalRespond({
    address: farcasterResponse?.address,
    twitter: twitterHandle,
    handle,
    url: req.nextUrl.origin,
    fallbackData: {
      farcaster: farcasterResponse,
    },
  });
};

const resolveUniversalHandle = async (
  handle: string,
  req: RequestInterface,
  isRelation: boolean
) => {
  if (!handle) return respondEmpty();
  if (regexEth.test(handle)) {
    return await resolveETHResponse(handle, req, isRelation);
  }
  if (regexEns.test(handle)) {
    return await resolveENSResponse(handle, req, isRelation);
  }
  if (regexLens.test(handle)) {
    return await resolveLensResponse(handle, req, isRelation);
  }
  if (universalFarcaster.test(handle)) {
    return await resolveFarcasterResponse(handle, req, isRelation);
  }
  if (regexTwitter.test(handle)) {
    return await resolveTwitterResponse(handle, req, isRelation);
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
  // true to use relation service data provider
  return resolveUniversalHandle(lowercaseName, req, true);
}

export const config = {
  runtime: "edge",
  unstable_allowDynamic: [
    "**/node_modules/lodash/**/*.js",
    "**/node_modules/@ensdomain/address-encoder/**/*.js",
    "**/node_modules/js-sha256/**/*.js",
  ],
};
