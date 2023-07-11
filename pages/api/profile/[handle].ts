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
import { NeighbourDetail } from "@/utils/types";
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
      "Cache-Control": "cache",
    },
  })
    .then((res) => res.json())
    .catch((e) => {
      console.log(e, "error");
      return errorHandle({
        address: null,
        identity: handle,
        platform: _platform,
        code: 500,
        message: e.message,
      });
    });
  return fetchRes;
};

const resolveUniversalFromRelation = async ({
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
  const _identity = responseFromRelation?.data?.identity;
  if (!_identity?.neighbor) return respondEmpty();
  const sourceNeighbour = {
    platform: _identity.platform,
    identity: _identity.identity,
    displayName: _identity.displayName,
    uuid: _identity.uuid,
  };
  const neighbours = responseFromRelation.data.identity.neighbor?.map(
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
          (response) => (response as PromiseFulfilledResult<Response>).value
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
  return respondWithCache(JSON.stringify(obj));
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
  for (const [platform, regex] of Object.entries(handleResolvers)) {
    if (regex.test(handle)) {
      const resolvedHandle =
        regex === regexUniversalFarcaster
          ? handle.replaceAll(".farcaster", "")
          : handle;
      return await resolveUniversalFromRelation({
        platform: platform as PlatformType,
        handle: resolvedHandle,
        req,
      });
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
