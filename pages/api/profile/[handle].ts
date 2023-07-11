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
import { getRelationQuery } from "@/utils/query";
import { NeighbourDetail, ProfileAPIResponse } from "@/utils/types";
interface RequestInterface extends NextApiRequest {
  nextUrl: {
    origin: string;
  };
}

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

const respondEmpty = () => {
  return new Response(JSON.stringify([]), {
    status: 404,
    headers: {
      "Cache-Control": "no-store",
    },
  });
};

const resolveHandleFromRelationService = (
  handle: string,
  platform?: PlatformType
) => {
  const _platform = platform || handleSearchPlatform(handle);
  const query = getRelationQuery(handle);
  return fetch(nextidGraphQLEndpoint, {
    method: "POST",
    body: JSON.stringify({
      query,
      variables: {
        platform: _platform,
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
  if (!handle) respondEmpty();
  const responseFromRelation = await resolveHandleFromRelationService(
    handle,
    platform
  );
  console.log(responseFromRelation, "response");
  if (responseFromRelation?.error)
    return errorHandle({
      address: null,
      identity: handle,
      platform,
      message: responseFromRelation?.error,
      code: 500,
    });
  const resolved =
    responseFromRelation?.data?.identity || responseFromRelation?.data?.domain;
  const originNeighbours = resolved?.neighbor || resolved?.resolved?.neighbor;
  const resolvedIdentity = resolved?.identity ? resolved : resolved?.resolved;
  if (!originNeighbours || !resolvedIdentity) return respondEmpty();

  const sourceNeighbour = {
    platform: resolvedIdentity?.platform,
    identity: resolvedIdentity?.identity,
    displayName: resolvedIdentity?.displayName,
    uuid: resolvedIdentity?.uuid,
  };
  const neighbours = originNeighbours.map(
    (x: { identity: NeighbourDetail }) => {
      return {
        ...x.identity,
      };
    }
  );
  neighbours.unshift(sourceNeighbour);
  const obj = await Promise.allSettled([
    ...neighbours.map((x: NeighbourDetail) => {
      if (
        [
          PlatformType.ethereum,
          PlatformType.farcaster,
          PlatformType.lens,
        ].includes(x.platform) &&
        x.displayName
      ) {
        const resolvedPlatform =
          x.platform === PlatformType.ethereum ? PlatformType.ens : x.platform;
        return fetch(
          req.nextUrl.origin + `/api/profile/${resolvedPlatform}/${x.identity}`
        ).then((res) => res.json());
      }
    }),
  ])
    .then((responses) => {
      return responses
        .filter(
          (response) =>
            response.status === "fulfilled" &&
            response.value &&
            !response.value.error
        )
        .map(
          (response) =>
            (response as PromiseFulfilledResult<ProfileAPIResponse>).value
        );
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

  return respondWithCache(
    JSON.stringify(
      sortByPlatform(obj as ProfileAPIResponse[], platform || PlatformType.ens)
    )
  );
};
const resolveUniversalHandle = async (
  handle: string,
  req: RequestInterface
) => {
  if (!handle) return respondEmpty();
  const handleResolvers = {
    [PlatformType.nextid]: regexAvatar,
    [PlatformType.ethereum]: regexEth,
    [PlatformType.ens]: regexEns,
    [PlatformType.lens]: regexLens,
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
  return resolveUniversalRespondFromRelation({
    platform: platformToQuery as PlatformType,
    handle: handleToQuery,
    req,
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
