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
import { neighborDetail, ProfileAPIResponse } from "@/utils/types";
import { resolveENSHandle } from "./ens/[handle]";
import { resolveLensHandle } from "./lens/[handle]";
import { resolveFarcasterHandle } from "./farcaster/[handle]";
import { resolveDotbitHandle } from "./dotbit/[handle]";
interface RequestInterface extends NextApiRequest {
  nextUrl: {
    origin: string;
  };
}

const nextidGraphQLEndpoint =
  process.env.NEXT_PUBLIC_GRAPHQL_SERVER ||
  "https://relation-service-tiger.next.id";
// staging
// const nextidGraphQLEndpoint='https://relation-service.nextnext.id/

const getPlatformSort = (
  obj: Array<ProfileAPIResponse>,
  platform: PlatformType
) => {
  if (
    [PlatformType.ens, PlatformType.lens, PlatformType.farcaster].includes(
      platform
    )
  )
    return platform;
  if (obj.find((x) => x.platform === PlatformType.ens)) return PlatformType.ens;
  if (obj.find((x) => x.platform === PlatformType.lens))
    return PlatformType.lens;
  return PlatformType.farcaster;
};

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
  platform: PlatformType
) => {
  return arr.sort((a, b) => {
    if (a.platform === platform && b.platform !== platform) {
      return -1;
    }
    if (a.platform !== platform && b.platform === platform) {
      return 1;
    }
    return 0;
  });
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
  if (!resolvedIdentity)
    return errorHandle({
      identity: handle,
      platform,
      code: 404,
      message: ErrorMessages.notFound,
    });

  const sourceneighbor = {
    platform: resolvedIdentity.platform,
    identity: resolvedIdentity.identity,
    displayName: resolvedIdentity.displayName || resolved.name,
    uuid: resolvedIdentity.uuid,
  };

  const neighbors = originneighbors.map((x: { identity: neighborDetail }) => {
    return {
      ...x.identity,
    };
  });
  neighbors.unshift(sourceneighbor);
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
    ...neighbors.map((x: neighborDetail) => {
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
        switch (resolvedPlatform) {
          case PlatformType.ens:
            return resolveENSHandle(resolvedHandle);
          case PlatformType.lens:
            return resolveLensHandle(resolvedHandle);
          case PlatformType.dotbit:
            return resolveDotbitHandle(resolvedHandle);
          case PlatformType.farcaster:
            return resolveFarcasterHandle(resolvedHandle);
          default:
            return Promise.reject({ value: undefined });
        }
      }
    }),
  ])
    .then((responses) => {
      const returnRes = responses
        .filter(
          (response) =>
            response.status === "fulfilled" &&
            response.value?.address &&
            response.value?.identity &&
            !response.value?.error
        )
        .map(
          (response) =>
            (response as PromiseFulfilledResult<ProfileAPIResponse>).value
        );
      return returnRes?.length
        ? respondWithCache(
            JSON.stringify(
              sortByPlatform(returnRes, getPlatformSort(returnRes, platform))
            )
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
  return resolveUniversalHandle(inputName, req);
}

export const config = {
  runtime: "edge",
  unstable_allowDynamic: [
    "**/node_modules/lodash/**/*.js",
    "**/node_modules/@ensdomain/address-encoder/**/*.js",
    "**/node_modules/js-sha256/**/*.js",
  ],
};
