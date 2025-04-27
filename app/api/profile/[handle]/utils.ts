import {
  PLATFORMS_TO_EXCLUDE,
  errorHandle,
  formatText,
  isSameAddress,
  isWeb3Address,
  normalizeText,
  respondWithCache,
  shouldPlatformFetch,
} from "@/utils/base";
import { PlatformType } from "@/utils/platform";
import { QueryType, queryIdentityGraph } from "@/utils/query";
import {
  AuthHeaders,
  ErrorMessages,
  IdentityGraphQueryResponse,
  IdentityRecord,
  ProfileAPIResponse,
  ProfileNSResponse,
  ProfileRecord,
} from "@/utils/types";

import { generateProfileStruct } from "@/utils/utils";
import { processJson } from "../../graph/utils";

const DEFAULT_PLATFORM_ORDER = [
  PlatformType.ens,
  PlatformType.basenames,
  PlatformType.linea,
  PlatformType.ethereum,
  PlatformType.farcaster,
  PlatformType.lens,
];

const directPass = (identity: IdentityRecord) => {
  if (identity.isPrimary) return true;
  return [PlatformType.farcaster, PlatformType.lens].includes(
    identity.platform,
  );
};

function sortProfilesByPlatform(
  responses: ProfileAPIResponse[] | ProfileNSResponse[],
  targetPlatform: PlatformType,
  handle: string,
): ProfileAPIResponse[] {
  const order = [
    targetPlatform,
    ...DEFAULT_PLATFORM_ORDER.filter((x) => x !== targetPlatform),
  ];

  const normalizedHandle = normalizeText(handle);

  const exactMatch = responses.find(
    (x) => x.identity === normalizedHandle && x.platform === targetPlatform,
  );

  const sortedResponses = responses
    .filter(
      (response) =>
        !(
          response.identity === normalizedHandle &&
          response.platform === targetPlatform
        ),
    )
    .sort((a, b) => {
      const indexA = order.indexOf(a.platform as PlatformType);
      const indexB = order.indexOf(b.platform as PlatformType);

      const validA = indexA !== -1;
      const validB = indexB !== -1;

      if (!validA && !validB) return 0;
      if (!validA) return 1;
      if (!validB) return -1;

      return indexA - indexB;
    });

  return [exactMatch, ...sortedResponses].filter(
    Boolean,
  ) as ProfileAPIResponse[];
}

export const resolveWithIdentityGraph = async ({
  handle,
  platform,
  ns,
  response,
}: {
  handle: string;
  platform: PlatformType;
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

  const responsesToSort = (
    await Promise.allSettled(
      profilesArray.map((_profile) =>
        generateProfileStruct(
          _profile as ProfileRecord,
          ns,
          response.data.identity.identityGraph?.edges,
        ),
      ),
    )
  )
    .filter(
      (result): result is PromiseFulfilledResult<any> =>
        result.status === "fulfilled",
    )
    .map((result) => result.value);

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
  ns: boolean = false,
) => {
  const response = await queryIdentityGraph(
    ns ? QueryType.GET_PROFILES_NS : QueryType.GET_PROFILES,
    handle,
    platform,
    headers,
  );
  const res = (await resolveWithIdentityGraph({
    handle,
    platform,
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

const VALID_PLATFORMS = new Set([
  PlatformType.ethereum,
  PlatformType.ens,
  PlatformType.basenames,
  PlatformType.linea,
  PlatformType.unstoppableDomains,
  PlatformType.dotbit,
  PlatformType.twitter,
  PlatformType.nextid,
]);

const SOCIAL_PLATFORMS = new Set([PlatformType.farcaster, PlatformType.lens]);
const INCLUSIVE_PLATFORMS = new Set([
  PlatformType.twitter,
  PlatformType.nextid,
]);

const getResolvedRecord = (identity: IdentityRecord) => {
  if (!identity) return null;
  const res = { ...identity };
  const vertices = res.identityGraph?.vertices || [];
  const farcasterEqualsENS = vertices
    .filter((x) => x.platform === PlatformType.ens && !x.isPrimary)
    .map((x) => {
      if (
        vertices.some(
          (i) =>
            i.platform === PlatformType.farcaster && i.identity === x.identity,
        )
      ) {
        x.isPrimary = true;
        x.isPrimaryFarcaster = true;
        return x;
      }
    })
    .filter((x) => !!x);
  if (farcasterEqualsENS.length > 0) res.isPrimary = true;

  return res;
};

export const getResolvedProfileArray = (
  data: IdentityGraphQueryResponse,
  platform: PlatformType,
) => {
  const resolvedRecord = getResolvedRecord(data?.data?.identity);
  if (!resolvedRecord) return [];

  const {
    identity,
    platform: recordPlatform,
    resolvedAddress,
    identityGraph,
    profile,
    isPrimary,
    ownerAddress,
  } = resolvedRecord;
  const firstResolvedAddress = resolvedAddress?.[0]?.address;
  const firstOwnerAddress = ownerAddress?.[0]?.address;
  const defaultReturn = profile
    ? {
        ...profile,
        isPrimary,
        createdAt: resolvedRecord.registeredAt,
      }
    : {
        address: isWeb3Address(identity) ? identity : null,
        identity,
        platform: recordPlatform,
        displayName: isWeb3Address(identity) ? formatText(identity) : identity,
        isPrimary,
      };

  const vertices = identityGraph?.vertices;

  if (PLATFORMS_TO_EXCLUDE.includes(platform) || vertices?.length <= 1) {
    return [defaultReturn];
  }

  let results = [];
  // Handle direct pass case
  const isBadBasename =
    recordPlatform === PlatformType.basenames &&
    firstOwnerAddress !== firstResolvedAddress;
  if (directPass(resolvedRecord) && !isBadBasename) {
    results = vertices
      .filter((vertex) => {
        if (!directPass(vertex)) return false;
        if (
          vertex.platform === PlatformType.ens &&
          !vertex.isPrimaryFarcaster
        ) {
          const vertexOwnerAddr = vertex.ownerAddress?.[0]?.address;
          const vertexResolvedAddr = vertex.resolvedAddress?.[0]?.address;
          return vertexOwnerAddr === vertexResolvedAddr;
        }
        return true;
      })
      .map((vertex) => ({
        ...vertex.profile,
        isPrimary: vertex.isPrimary,
        createdAt: vertex.registeredAt,
      }));
  } else if (VALID_PLATFORMS.has(recordPlatform)) {
    // Get source address for comparison only once
    const sourceAddr =
      recordPlatform === PlatformType.ethereum
        ? identity
        : firstResolvedAddress;

    // Filter vertices according to platform rules
    results = vertices
      .filter((vertex) => {
        // Skip non-matching vertices quickly
        if (!vertex.isPrimary && !SOCIAL_PLATFORMS.has(vertex.platform)) {
          return false;
        }

        // For inclusive platforms, include everything primary or social
        if (INCLUSIVE_PLATFORMS.has(recordPlatform)) {
          return true;
        }

        // Address comparison logic
        if (vertex.platform === PlatformType.farcaster) {
          return (
            vertex.ownerAddress?.some((addr) =>
              isSameAddress(addr.address, sourceAddr),
            ) ?? false
          );
        }

        return isSameAddress(vertex.resolvedAddress?.[0]?.address, sourceAddr);
      })
      .map((vertex) => ({
        ...vertex.profile,
        isPrimary: vertex.isPrimary,
        createdAt: vertex.registeredAt,
      }));

    if (
      (recordPlatform === PlatformType.ethereum &&
        !results.some((x) => x.isPrimary && x.platform === PlatformType.ens)) ||
      !(
        INCLUSIVE_PLATFORMS.has(recordPlatform) ||
        recordPlatform === PlatformType.ethereum
      )
    ) {
      results = [...results, defaultReturn];
    }
  } else {
    results = [defaultReturn];
  }

  return results
    .filter((x) => shouldPlatformFetch(x.platform))
    .filter(
      (item, index, self) =>
        index ===
        self.findIndex(
          (i) => i.platform === item.platform && i.identity === item.identity,
        ),
    )
    .sort((a, b) => Number(b.isPrimary) - Number(a.isPrimary));
};
