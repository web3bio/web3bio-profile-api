import type { NextApiRequest } from "next";
import {
  errorHandle,
  ErrorMessages,
  formatText,
  isValidEthereumAddress,
  respondWithCache,
} from "@/utils/base";
import { PlatformType } from "@/utils/platform";
import { handleSearchPlatform } from "@/utils/utils";
import { GET_PROFILES, primaryDomainResolvedRequestArray } from "@/utils/query";
import { ProfileAPIResponse } from "@/utils/types";
import { shouldPlatformFetch } from "../../../utils/base";
export interface RequestInterface extends NextApiRequest {
  nextUrl: {
    origin: string;
  };
}

const nextidGraphQLEndpoint =
  process.env.NEXT_PUBLIC_GRAPHQL_SERVER ||
  "https://relation-service-tiger.next.id";
// staging
// const nextidGraphQLEndpoint='https://relation-service.nextnext.id/

const resolveHandleFromRelationService = (
  handle: string,
  platform: PlatformType = handleSearchPlatform(handle)!
) => {
  return fetch(nextidGraphQLEndpoint, {
    method: "POST",
    headers: {
      "x-api-key": process.env.NEXT_PUBLIC_RELATION_API_KEY || "",
    },
    body: JSON.stringify({
      query: GET_PROFILES,
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
    PlatformType.farcaster,
    PlatformType.lens,
    PlatformType.dotbit,
    PlatformType.unstoppableDomains,
  ];

  const order = defaultOrder.includes(platform)
    ? [platform, ...defaultOrder.filter((x) => x !== platform)]
    : defaultOrder;

  const first: Array<ProfileAPIResponse> = [];
  const second: Array<ProfileAPIResponse> = [];
  const third: Array<ProfileAPIResponse> = [];
  const forth: Array<ProfileAPIResponse> = [];
  const fifth: Array<ProfileAPIResponse> = [];

  arr.map((x) => {
    if (x.platform === order[0]) first.push(x);
    if (x.platform === order[1]) second.push(x);
    if (x.platform === order[2]) third.push(x);
    if (x.platform === order[3]) forth.push(x);
    if (x.platform === order[4]) fifth.push(x);
  });
  return [
    first.find((x) => x.identity === handle),
    ...first?.filter((x) => x.identity !== handle),
  ]
    .concat(second)
    .concat(third)
    .concat(forth)
    .concat(fifth)
    .filter((x) => !!x);
};
const resolveUniversalRespondFromRelation = async ({
  platform,
  handle,
  req,
  ns,
}: {
  platform: PlatformType;
  handle: string;
  req: RequestInterface;
  ns?: boolean;
}) => {
  const responseFromRelation = await resolveHandleFromRelationService(
    handle,
    platform
  );
  if (responseFromRelation?.errors)
    return errorHandle({
      identity: handle,
      platform,
      message: responseFromRelation?.errors[0]?.message,
      code: 500,
    });

  const resolvedRequestArray = primaryDomainResolvedRequestArray(
    responseFromRelation,
    handle,
    platform
  ).sort((a, b) => {
    if (a.reverse && b.reverse) return 0;
    if (a.reverse && !b.reverse) return -1;
    if (!a.reverse && b.reverse) return 1;
    return 0;
  });


  if (!resolvedRequestArray.some((x) => x.platform !== PlatformType.nextid))
    return errorHandle({
      identity: handle,
      code: 404,
      message: ErrorMessages.invalidResolved,
      platform,
    });
  return await Promise.allSettled([
    ...resolvedRequestArray.map((x: { platform: string; identity: string }) => {
      if (x.identity && shouldPlatformFetch(x.platform as PlatformType)) {
        const fetchURL = `${req.nextUrl.origin}/${
          ns ? "ns" : "profile"
        }/${x.platform.toLowerCase()}/${x.identity}`;
        return fetch(fetchURL).then((res) => res.json());
      }
    }),
  ])
    .then((responses) => {
      const responsesToSort = responses
        .filter(
          (response) =>
            response.status === "fulfilled" &&
            response.value?.identity &&
            !response.value?.error
        )
        .map(
          (response) =>
            (response as PromiseFulfilledResult<ProfileAPIResponse>)?.value
        );
      const returnRes = sortByPlatform(responsesToSort, platform, handle);

      if (
        platform === PlatformType.ethereum &&
        !returnRes.some((x) => x?.address === handle)
      ) {
        returnRes.unshift(responsesToSort.find((x) => x?.address === handle));
      }
      if (!returnRes?.length && platform === PlatformType.ethereum) {
        const nsObj = {
          address: handle,
          identity: handle,
          platform: PlatformType.ethereum,
          displayName: formatText(handle),
          avatar: null,
          description: null,
        };
        returnRes.push(
          (ns
            ? nsObj
            : {
                ...nsObj,
                email: null,
                location: null,
                header: null,
                links: {},
              }) as ProfileAPIResponse
        );
      }
      const uniqRes = returnRes.reduce((pre, cur) => {
        if (
          cur &&
          !pre.find(
            (x) => x.platform === cur.platform && x.identity === cur.identity
          )
        ) {
          pre.push(cur);
        }
        return pre;
      }, [] as ProfileAPIResponse[]);
      return uniqRes?.filter((x) => !x?.error)?.length
        ? respondWithCache(JSON.stringify(uniqRes))
        : errorHandle({
            identity: handle,
            code: 404,
            message: uniqRes[0]?.error || ErrorMessages.notFound,
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
export const resolveUniversalHandle = async (
  handle: string,
  req: RequestInterface,
  platform: PlatformType,
  ns?: boolean
) => {
  const handleToQuery = handle.endsWith(".farcaster")
    ? handle.substring(0, handle.length - 10)
    : handle;
  if (!handleToQuery || !platform)
    return errorHandle({
      identity: handle,
      platform: PlatformType.nextid,
      code: 404,
      message: ErrorMessages.invalidIdentity,
    });
  if (
    platform === PlatformType.ethereum &&
    !isValidEthereumAddress(handleToQuery)
  )
    return errorHandle({
      identity: handle,
      platform: PlatformType.ethereum,
      code: 404,
      message: ErrorMessages.invalidAddr,
    });
  return await resolveUniversalRespondFromRelation({
    platform,
    handle: handleToQuery,
    req,
    ns,
  });
};

export default async function handler(req: RequestInterface) {
  const searchParams = new URLSearchParams(req.url?.split("?")[1] || "");
  const inputName = searchParams.get("handle")?.toLowerCase() || "";
  const platform = handleSearchPlatform(inputName);
  if (!inputName || !platform || !shouldPlatformFetch(platform)) {
    return errorHandle({
      identity: inputName,
      code: 404,
      platform: null,
      message: ErrorMessages.invalidIdentity,
    });
  }
  return await resolveUniversalHandle(inputName, req, platform, false);
}

export const config = {
  runtime: "edge",
  regions: ["sfo1", "iad1", "pdx1"],
  maxDuration: 45,
};
