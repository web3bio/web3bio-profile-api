import type { NextApiRequest } from "next";
import { errorHandle, ErrorMessages, respondWithCache } from "@/utils/base";
import { handleSearchPlatform, PlatformType } from "@/utils/platform";
import {
  regexAvatar,
  regexDotbit,
  regexEns,
  regexEth,
  regexLens,
  regexTwitter,
  regexUniversalFarcaster,
} from "@/utils/regexp";
import { getRelationQuery } from "@/utils/query";
import { NeighborDetail, ProfileAPIResponse } from "@/utils/types";
interface RequestInterface extends NextApiRequest {
  nextUrl: {
    origin: string;
  };
}

const processArr = (arr: NeighborDetail[]) => {
  const cache: NeighborDetail[] = [];
  for (const t of arr) {
    if (
      cache.find((c) => c.platform === t.platform && c.identity === t.identity)
    ) {
      continue;
    }
    cache.push(t);
  }

  return cache;
};

const nextidGraphQLEndpoint =
  process.env.NEXT_PUBLIC_GRAPHQL_SERVER ||
  "https://relation-service-tiger.next.id";
// staging
// const nextidGraphQLEndpoint='https://relation-service.nextnext.id/

const resolveHandleFromRelationService = (
  handle: string,
  platform: PlatformType = handleSearchPlatform(handle)
) => {
  const query = getRelationQuery(platform);
  return fetch(nextidGraphQLEndpoint, {
    method: "POST",
    headers: {
      "x-api-key": process.env.NEXT_PUBLIC_RELATION_API_KEY || "",
    },
    body: JSON.stringify({
      query,
      variables: {
        platform,
        identity: handle,
      },
    }),
  })
    .then((res) => res.json())
    .catch((e) => ({
      error: e,
    }));
};
const sortByPlatform = (
  arr: Array<ProfileAPIResponse>,
  platform: PlatformType,
  handle: string
) => {
  const defaultOrder = [
    PlatformType.ens,
    PlatformType.lens,
    PlatformType.farcaster,
    PlatformType.dotbit,
  ];

  const order = defaultOrder.includes(platform)
    ? [platform, ...defaultOrder.filter((x) => x !== platform)]
    : defaultOrder;

  const first: Array<ProfileAPIResponse> = [];
  const second: Array<ProfileAPIResponse> = [];
  const third: Array<ProfileAPIResponse> = [];
  const forth: Array<ProfileAPIResponse> = [];

  arr.map((x) => {
    if (x.platform === order[0]) first.push(x);
    if (x.platform === order[1]) second.push(x);
    if (x.platform === order[2]) third.push(x);
    if (x.platform === order[3]) forth.push(x);
  });
  return [
    first.find((x) => x.identity === handle),
    ...first?.filter((x) => x.identity !== handle),
  ]
    .concat(second)
    .concat(third)
    .concat(forth)
    .filter((x) => !!x);
};
const resolveUniversalRespondFromRelation = async ({
  platform,
  handle,
  req,
}: {
  platform: PlatformType;
  handle: string;
  req: RequestInterface;
}) => {
  const responseFromRelation = await resolveHandleFromRelationService(
    handle,
    platform
  );
  if (!responseFromRelation || responseFromRelation?.error)
    return errorHandle({
      identity: handle,
      platform,
      message: responseFromRelation?.error,
      code: 500,
    });
  const resolved =
    responseFromRelation?.data?.identity || responseFromRelation?.data?.domain;
  const originneighbors =
    resolved?.neighbor || resolved?.resolved?.neighbor || [];
  const resolvedIdentity = resolved?.resolved ? resolved?.resolved : resolved;

  const sourceNeighbor = resolvedIdentity
    ? {
        platform: resolvedIdentity.platform,
        identity: resolvedIdentity.identity,
        displayName: resolvedIdentity.displayName || resolved.name,
        uuid: resolvedIdentity.uuid,
      }
    : {
        platform,
        identity: handle,
      };

  const neighbors = processArr([
    ...originneighbors.map((x: { identity: NeighborDetail }) => {
      return {
        ...x.identity,
      };
    }),
    sourceNeighbor,
  ]);

  if (
    regexEns.test(handle) &&
    neighbors.filter(
      (x: { platform: PlatformType }) => x.platform === PlatformType.ethereum
    ).length === 1
  )
    neighbors.forEach((x: { platform: PlatformType; displayName: string }) => {
      if (
        x.platform === PlatformType.ethereum &&
        !!x.displayName &&
        x.displayName !== handle
      ) {
        x.displayName = handle;
      }
    });
  return await Promise.allSettled([
    ...neighbors.map((x: NeighborDetail) => {
      if (
        [
          PlatformType.ethereum,
          PlatformType.farcaster,
          PlatformType.lens,
          PlatformType.dotbit,
        ].includes(x.platform) &&
        x.identity
      ) {
        const resolvedHandle =
          x.platform === PlatformType.ethereum ? x.displayName : x.identity;
        const resolvedPlatform =
          x.platform === PlatformType.ethereum ? PlatformType.ens : x.platform;
        const fetchURL = `${req.nextUrl.origin}/profile/${resolvedPlatform}/${resolvedHandle}`;
        if (resolvedHandle && resolvedPlatform)
          return fetch(fetchURL).then((res) => res.json());
      }
    }),
  ])
    .then((responses) => {
      const returnRes = responses
        .filter(
          (response) =>
            response.status === "fulfilled" &&
            response.value?.address &&
            response.value?.identity
        )
        .map(
          (response) =>
            (response as PromiseFulfilledResult<ProfileAPIResponse>)?.value
        );
      return returnRes?.length
        ? respondWithCache(
            JSON.stringify(sortByPlatform(returnRes, platform, handle))
          )
        : errorHandle({
            identity: handle,
            code: 404,
            message: ErrorMessages.notFound,
            platform,
          });
    })
    .catch((error) => {
      return errorHandle({
        identity: handle,
        code: 500,
        message: error,
        platform,
      });
    });
};
const resolveUniversalHandle = async (
  handle: string,
  req: RequestInterface
) => {
  const handleResolvers = {
    [PlatformType.nextid]: regexAvatar,
    [PlatformType.ethereum]: regexEth,
    [PlatformType.ens]: regexEns,
    [PlatformType.lens]: regexLens,
    [PlatformType.dotbit]: regexDotbit,
    [PlatformType.farcaster]: regexUniversalFarcaster,
    [PlatformType.twitter]: regexTwitter,
  };
  let handleToQuery = "";
  let platformToQuery = "";
  for (const [platform, regex] of Object.entries(handleResolvers)) {
    if (regex.test(handle)) {
      handleToQuery =
        regex === regexUniversalFarcaster
          ? handle.replaceAll(".farcaster", "")
          : handle;
      platformToQuery = platform;
    }
  }
  if (!handleToQuery || !platformToQuery)
    return errorHandle({
      identity: handle,
      platform: PlatformType.nextid,
      code: 404,
      message: ErrorMessages.invalidIdentity,
    });
  return await resolveUniversalRespondFromRelation({
    platform: platformToQuery as PlatformType,
    handle: handleToQuery,
    req,
  });
};

export default async function handler(req: RequestInterface) {
  const searchParams = new URLSearchParams(req.url?.split("?")[1] || "");
  const inputName = searchParams.get("handle")?.toLowerCase() || "";
  return await resolveUniversalHandle(inputName, req);
}

export const config = {
  runtime: "edge",
  regions: ["sfo1", "hnd1", "sin1"],
  maxDuration: 45,
  unstable_allowDynamic: [
    "**/node_modules/lodash/**/*.js",
    "**/node_modules/@ensdomain/address-encoder/**/*.js",
    "**/node_modules/js-sha256/**/*.js",
  ],
};
