import type { NextApiRequest } from "next";
import { errorHandle, ErrorMessages } from "@/utils/base";
import { handleSearchPlatform, PlatformType } from "@/utils/platform";
import {
  regexAvatar,
  regexEns,
  regexEth,
  regexLens,
  regexTwitter,
  regexUniversalFarcaster,
} from "@/utils/regexp";
import {
  getResolverAddressFromName,
  resolveENSCoinTypesValue,
} from "./ens/[handle]";
import { getRelationQuery } from "@/utils/query";
import { NeighborWithTraversal, ProofRecord } from "@/utils/types";
interface RequestInterface extends NextApiRequest {
  nextUrl: {
    origin: string;
  };
}

const getTranversal = (data: {
  neighborWithTraversal: NeighborWithTraversal[];
}) => {
  return data?.neighborWithTraversal.reduce((pre, cur) => {
    pre.push({
      ...cur.from,
    });
    pre.push({
      ...cur.to,
    });
    return pre;
  }, [] as ProofRecord[]);
};

const getTwitterHandleRelation = (
  res: { neighborWithTraversal: NeighborWithTraversal[] },
  platformType: PlatformType
) => {
  return (
    getTranversal(res)?.find(
      (x: ProofRecord) => x.platform === platformType
    ) as ProofRecord
  )?.identity;
};

const nextidGraphQLEndpoint =
  process.env.NEXT_PUBLIC_GRAPHQL_SERVER ||
  "https://relation-service-tiger.next.id";
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
  return response?.records?.find(
    (x: { sns_handle: string }) => x.sns_handle === twitterHandle
  )?.web3_addr;
};

export const resolveTwitterFromETH = async (address: string) => {
  const endPoint = `https://twitter-handler-proxy.r2d2.to/v1/relation/handles?wallet=${address}&isVerified=true`;
  const response = await fetch(endPoint).then((res) => res.json());
  return response?.data?.[0];
};

const respondEmpty = () => {
  return new Response(JSON.stringify([]), {
    status: 404,
    headers: {
      "Cache-Control": "no-store",
    },
  });
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
  const obj = await Promise.allSettled([
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
      return responses
        .filter(
          (response) => response.status === "fulfilled" && !response.value.error
        )
        .map((response) => (response as PromiseFulfilledResult<any>).value);
    })
    .catch((error) => {
      return errorHandle({
        address: null,
        identity: handle,
        code: 500,
        message: error,
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
  })
    .then((res) => res.json())
    .catch((e) => {
      console.log(e, "error");
      return null;
    });
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
    ? (await resolveHandleFromRelationService(handle))?.data.domain.resolved
        ?.identity
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
      [PlatformType.lens]: lensResponse,
    },
  });
};

interface Neighbour {
  from: NeighbourDetail;
  to: NeighbourDetail;
}
interface NeighbourDetail {
  platform: PlatformType;
  identity: string;
  uuid: string;
  displayName: string;
}

const resolveAvatarResponse = async (
  handle: string,
  req: RequestInterface,
  isRelation: boolean
) => {
  const responseFromRelation = await resolveHandleFromRelationService(
    handle,
    PlatformType.nextid
  );
  if (!responseFromRelation?.data?.identity?.neighborWithTraversal) return respondEmpty();
  const neighbours = responseFromRelation.data.identity.neighborWithTraversal?.reduce(
    (pre: NeighbourDetail[], cur: Neighbour) => {
      pre.push({
        ...cur.from,
      });
      pre.push({
        ...cur.to,
      });
      return pre;
    },
    []
  );
  const address = neighbours?.find(
    (x: NeighbourDetail) => x.platform === PlatformType.ethereum
  )?.identity;
  const twitter = neighbours?.find(
    (x: NeighbourDetail) => x.platform === PlatformType.twitter
  )?.identity;
  return await universalRespond({
    address,
    twitter,
    handle,
    url: req.nextUrl.origin,
  });
};

const resolveFarcasterResponse = async (
  handle: string,
  req: RequestInterface,
  isRelation: boolean
) => {
  const resolvedHandle = handle.replace(".farcaster", "");
  let ethAddress = "";
  let twitterHandle = "";
  let farcasterResponse = null;
  if (isRelation) {
    const { data } =
      (await resolveHandleFromRelationService(
        resolvedHandle,
        PlatformType.farcaster
      )) ?? {};
    const identity = data?.identity;
    twitterHandle = getTwitterHandleRelation(identity, PlatformType.twitter);
    ethAddress = identity?.ownedBy.identity;
  } else {
    farcasterResponse = await fetch(
      req.nextUrl.origin + `/api/profile/farcaster/${resolvedHandle}`
    ).then((res) => res.json());
    if (!farcasterResponse?.address) return respondEmpty();
    ethAddress = farcasterResponse?.address;
    twitterHandle = await resolveTwitterFromETH(ethAddress);
  }

  return await universalRespond({
    address: ethAddress,
    twitter: twitterHandle,
    handle,
    url: req.nextUrl.origin,
    fallbackData: { [PlatformType.farcaster]: farcasterResponse },
  });
};

const resolveUniversalHandle = async (
  handle: string,
  req: RequestInterface,
  isRelation: boolean
) => {
  if (!handle) return respondEmpty();
  const handleResolvers: Record<
    string,
    [
      RegExp,
      (
        handle: string,
        req: RequestInterface,
        isRelation: boolean
      ) => Promise<any>
    ]
  > = {
    [PlatformType.nextid]: [regexAvatar, resolveAvatarResponse],
    [PlatformType.ethereum]: [regexEth, resolveETHResponse],
    [PlatformType.ens]: [regexEns, resolveENSResponse],
    [PlatformType.lens]: [regexLens, resolveLensResponse],
    [PlatformType.farcaster]: [
      regexUniversalFarcaster,
      resolveFarcasterResponse,
    ],
    [PlatformType.twitter]: [regexTwitter, resolveTwitterResponse],
  };
  for (const [platform, [regex, resolver]] of Object.entries(handleResolvers)) {
    if (regex.test(handle)) {
      return await resolver(handle, req, isRelation);
    }
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
  const searchParams = new URLSearchParams(req.url?.split("?")[1] || "");
  const inputName = searchParams.get("handle")?.toLowerCase() || "";
  if (!inputName) {
    return errorHandle({
      address: null,
      identity: inputName,
      platform: PlatformType.nextid,
      code: 404,
      message: ErrorMessages.invalidIdentity,
    });
  }
  // true to use relation service data provider
  // return resolveUniversalHandle(lowercaseName, req);
  return resolveUniversalHandle(inputName, req, true);
}

export const config = {
  runtime: "edge",
  unstable_allowDynamic: [
    "**/node_modules/lodash/**/*.js",
    "**/node_modules/@ensdomain/address-encoder/**/*.js",
    "**/node_modules/js-sha256/**/*.js",
  ],
};
