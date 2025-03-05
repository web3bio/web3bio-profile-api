import {
  PLATFORMS_TO_EXCLUDE,
  errorHandle,
  formatText,
  prettify,
  respondWithCache,
} from "@/utils/base";
import { PlatformType } from "@/utils/platform";
import {
  GET_PROFILES,
  getResolvedProfileArray,
  queryIdentityGraph,
} from "@/utils/query";
import {
  AuthHeaders,
  ErrorMessages,
  ProfileAPIResponse,
  ProfileNSResponse,
  ProfileRecord,
} from "@/utils/types";

import { processJson } from "../../graph/utils";
import { generateProfileStruct } from "@/utils/utils";

export const IDENTITY_GRAPH_SERVER =
  process.env.NEXT_PUBLIC_GRAPHQL_SERVER || "";

const DEFAULT_PLATFORM_ORDER = [
  PlatformType.ens,
  PlatformType.basenames,
  PlatformType.ethereum,
  PlatformType.farcaster,
  PlatformType.lens,
];

function sortProfilesByPlatform(
  responses: ProfileAPIResponse[] | ProfileNSResponse[],
  targetPlatform: PlatformType,
  handle: string,
): ProfileAPIResponse[] {
  const order = [
    targetPlatform,
    ...DEFAULT_PLATFORM_ORDER.filter((x) => x !== targetPlatform),
  ];

  const sortedResponses = responses.reduce(
    (acc, response) => {
      const { platform } = response;
      const index = order.indexOf(platform as PlatformType);
      if (index >= 0 && index < 6) {
        acc[index].push(response);
      }
      return acc;
    },
    Array.from({ length: 6 }, (_, i) =>
      i === 0
        ? [
            responses.find(
              (x) => x.identity === handle && x.platform === targetPlatform,
            ),
          ]
        : [],
    ),
  );

  return sortedResponses.flat().filter(Boolean) as ProfileAPIResponse[];
}

export const resolveWithIdentityGraph = async ({
  platform,
  handle,
  ns,
  response,
}: {
  platform: PlatformType;
  handle: string;
  ns?: boolean;
  response: any;
}) => {
  if (response.msg) {
    return {
      identity: handle,
      platform,
      message: response.msg,
      code: response.code || 500,
    };
  }
  if (!response?.data?.identity || response?.errors)
    return {
      identity: handle,
      platform,
      message: response.errors ? response.errors : ErrorMessages.notFound,
      code: response.errors ? 500 : 404,
    };
  const resolvedResponse = await processJson(response);

  const profilesArray = getResolvedProfileArray(resolvedResponse, platform);

  const responsesToSort = await Promise.all(
    profilesArray.map((_profile) =>
      generateProfileStruct(
        _profile as ProfileRecord,
        ns,
        response.data.identity.identityGraph?.edges,
      ),
    ),
  );

  const returnRes = PLATFORMS_TO_EXCLUDE.includes(platform)
    ? responsesToSort
    : sortProfilesByPlatform(responsesToSort, platform, handle);

  if (!returnRes.length && platform === PlatformType.ethereum) {
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
          }) as ProfileAPIResponse,
    );
  }

  const uniqRes = returnRes.filter(
    (item, index, self) =>
      index ===
      self.findIndex(
        (x) => x.platform === item.platform && x.identity === item.identity,
      ),
  ) as ProfileAPIResponse[];

  return uniqRes.length && !uniqRes.every((x) => x?.error)
    ? uniqRes
    : {
        identity: handle,
        code: 404,
        message: uniqRes[0]?.error || ErrorMessages.notFound,
        platform,
      };
};

export const resolveUniversalHandle = async (
  handle: string,
  platform: PlatformType,
  headers: AuthHeaders,
  ns?: boolean,
) => {
  const response = await queryIdentityGraph(
    handle,
    platform,
    GET_PROFILES(false),
    headers,
  );
  const res = (await resolveWithIdentityGraph({
    platform,
    handle: handle,
    ns,
    response,
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
