import {
  errorHandle,
  formatText,
  handleSearchPlatform,
  isValidEthereumAddress,
  respondWithCache,
  shouldPlatformFetch,
} from "@/utils/base";
import { PlatformType } from "@/utils/platform";
import { GET_PROFILES, primaryDomainResolvedRequestArray } from "@/utils/query";
import { ErrorMessages, ProfileAPIResponse } from "@/utils/types";
import { NextRequest } from "next/server";

export const PLATFORMS_TO_EXCLUDE = [
  PlatformType.dotbit,
  PlatformType.sns,
  PlatformType.solana,
];

// staging
// const nextidGraphQLEndpoint='https://relation-service.nextnext.id/
const NEXTID_GRAPHQL_ENDPOINT =
  process.env.NEXT_PUBLIC_GRAPHQL_SERVER ||
  "https://relation-service-tiger.next.id";

const DEFAULT_PLATFORM_ORDER = [
  PlatformType.ens,
  PlatformType.farcaster,
  PlatformType.lens,
  PlatformType.unstoppableDomains,
  PlatformType.ethereum,
];

async function resolveHandleFromRelationService(
  handle: string,
  platform: PlatformType = handleSearchPlatform(handle)!
): Promise<any> {
  try {
    const response = await fetch(NEXTID_GRAPHQL_ENDPOINT, {
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
    });
    return await response.json();
  } catch (e) {
    return { errors: e };
  }
}

function sortProfilesByPlatform(
  responses: ProfileAPIResponse[],
  targetPlatform: PlatformType,
  handle: string
): ProfileAPIResponse[] {
  const order = DEFAULT_PLATFORM_ORDER.includes(targetPlatform)
    ? [
        targetPlatform,
        ...DEFAULT_PLATFORM_ORDER.filter((x) => x !== targetPlatform),
      ]
    : DEFAULT_PLATFORM_ORDER;

  const sortedResponses = responses.reduce(
    (acc, response) => {
      const { platform, identity } = response;
      const index = order.indexOf(platform as PlatformType);
      if (index === 0) {
        acc.first.push(response);
      } else if (index === 1) {
        acc.second.push(response);
      } else if (index === 2) {
        acc.third.push(response);
      } else if (index === 3) {
        acc.fourth.push(response);
      } else if (index === 4) {
        acc.fifth.push(response);
      }
      return acc;
    },
    {
      first: new Array(responses.find((x) => x.identity === handle)),
      second: new Array(),
      third: new Array(),
      fourth: new Array(),
      fifth: new Array(),
    }
  );

  return [
    ...sortedResponses.first,
    ...sortedResponses.second,
    ...sortedResponses.third,
    ...sortedResponses.fourth,
    ...sortedResponses.fifth,
  ].filter(Boolean);
}
export const resolveUniversalRespondFromRelation = async ({
  platform,
  handle,
  req,
  ns,
}: {
  platform: PlatformType;
  handle: string;
  req: NextRequest;
  ns?: boolean;
}) => {
  const responseFromRelation = await resolveHandleFromRelationService(
    handle,
    platform
  );

  if (responseFromRelation?.errors)
    return {
      identity: handle,
      platform,
      message: responseFromRelation?.errors[0]?.message,
      code: 500,
    };
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
    return {
      identity: handle,
      code: 404,
      message: ErrorMessages.invalidResolved,
      platform,
    };

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
      const returnRes = PLATFORMS_TO_EXCLUDE.includes(platform)
        ? responsesToSort
        : sortProfilesByPlatform(responsesToSort, platform, handle);

      if (
        platform === PlatformType.ethereum &&
        !returnRes.some((x) => x?.address === handle)
      ) {
        returnRes.unshift(responsesToSort.find((x) => x?.address === handle)!);
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
        ? uniqRes
        : {
            identity: handle,
            code: 404,
            message: uniqRes[0]?.error || ErrorMessages.notFound,
            platform,
          };
    })
    .catch((error) => {
      return {
        identity: handle,
        code: 500,
        message: error,
        platform,
      };
    });
};

export const resolveUniversalHandle = async (
  handle: string,
  req: NextRequest,
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
  const res = (await resolveUniversalRespondFromRelation({
    platform,
    handle: handleToQuery,
    req,
    ns,
  })) as any;
  if (res.message) {
    return errorHandle({
      identity: res.identity,
      platform: res.platform,
      code: res.code,
      message: res.message,
    });
  } else {
    return respondWithCache(JSON.stringify(res));
  }
};
