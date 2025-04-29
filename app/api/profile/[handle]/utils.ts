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
  ProfileRecord,
} from "@/utils/types";

import { generateProfileStruct } from "@/utils/utils";
import { processJson } from "../../graph/utils";

// Constants
const DEFAULT_PLATFORM_ORDER = [
  PlatformType.ens,
  PlatformType.basenames,
  PlatformType.linea,
  PlatformType.ethereum,
  PlatformType.farcaster,
  PlatformType.lens,
];

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

// Helper functions
const isPrimaryOrSocialPlatform = (identity: IdentityRecord) =>
  identity.isPrimary || SOCIAL_PLATFORMS.has(identity.platform);

function sortProfilesByPlatform(
  responses: ProfileRecord[],
  targetPlatform: PlatformType,
  handle: string,
): ProfileRecord[] {
  const order = [
    targetPlatform,
    ...DEFAULT_PLATFORM_ORDER.filter((x) => x !== targetPlatform),
  ];
  const normalizedHandle = normalizeText(handle);

  // Find exact match
  const exactMatch = responses.find(
    (x) => x.identity === normalizedHandle && x.platform === targetPlatform,
  );

  // Filter and sort remaining responses
  const sortedResponses = responses
    .filter(
      (response) =>
        !(
          response.identity === normalizedHandle &&
          response.platform === targetPlatform
        ) && DEFAULT_PLATFORM_ORDER.includes(response.platform as PlatformType),
    )
    .sort((a, b) => {
      const indexA = order.indexOf(a.platform as PlatformType);
      const indexB = order.indexOf(b.platform as PlatformType);

      if (indexA === -1) return indexB === -1 ? 0 : 1;
      if (indexB === -1) return -1;
      return indexA - indexB;
    });

  return [exactMatch, ...sortedResponses].filter(Boolean) as ProfileRecord[];
}

const getResolvedRecord = (identity: IdentityRecord) => {
  if (!identity) return null;

  const res = { ...identity };
  const vertices = res.identityGraph?.vertices || [];

  // Process Farcaster-ENS relationships
  const farcasterEqualENSEntries = vertices
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
      return null;
    })
    .filter(Boolean);

  if (farcasterEqualENSEntries.length > 0) {
    res.isPrimary = true;
  }

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
    ? { ...profile, isPrimary, createdAt: resolvedRecord.registeredAt }
    : {
        address: isWeb3Address(identity) ? identity : null,
        identity,
        platform: recordPlatform,
        displayName: isWeb3Address(identity) ? formatText(identity) : identity,
        isPrimary,
      };

  const vertices = identityGraph?.vertices;

  // Early return for excluded platforms or single vertices
  if (
    PLATFORMS_TO_EXCLUDE.includes(platform) ||
    !vertices ||
    vertices.length <= 1
  ) {
    return [defaultReturn];
  }

  // Process based on platform type
  let results = [];
  const isBadBasename =
    recordPlatform === PlatformType.basenames &&
    firstOwnerAddress !== firstResolvedAddress;

  if (isPrimaryOrSocialPlatform(resolvedRecord) && !isBadBasename) {
    // Direct pass case
    results = vertices
      .filter((vertex) => {
        if (!isPrimaryOrSocialPlatform(vertex)) return false;
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
    // Get source address for comparison
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

    const shouldAddDefault =
      (recordPlatform === PlatformType.ethereum &&
        !results.some((x) => x.isPrimary && x.platform === PlatformType.ens)) ||
      !(
        INCLUSIVE_PLATFORMS.has(recordPlatform) ||
        recordPlatform === PlatformType.ethereum
      );

    if (shouldAddDefault) {
      results.push(defaultReturn);
    }
  } else {
    results = [defaultReturn];
  }

  // Filter duplicates and sort by primary status
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
  // Handle error cases
  if (response.msg) {
    return {
      identity: handle,
      platform,
      message: response.msg,
      code: response.code || 500,
    };
  }

  if (!response?.data?.identity || response?.errors) {
    return {
      identity: handle,
      platform,
      message: response.errors ? response.errors : ErrorMessages.notFound,
      code: response.errors ? 500 : 404,
    };
  }

  const resolvedResponse = await processJson(response);
  const profilesArray = getResolvedProfileArray(resolvedResponse, platform);

  const sortedProfiles = PLATFORMS_TO_EXCLUDE.includes(platform)
    ? profilesArray
    : sortProfilesByPlatform(profilesArray as any, platform, handle);

  // Process profiles in parallel
  const returnRes = (
    await Promise.allSettled(
      sortedProfiles.map((profile) =>
        generateProfileStruct(
          profile as ProfileRecord,
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

  // Handle Ethereum fallback
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
      ns
        ? nsObj
        : ({
            ...nsObj,
            email: null,
            location: null,
            header: null,
            links: {},
          } as ProfileAPIResponse),
    );
  }

  // Remove duplicates
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

  const res = await resolveWithIdentityGraph({
    handle,
    platform,
    ns,
    response,
  });

  if ("message" in res) {
    return errorHandle({
      identity: res.identity,
      platform: res.platform,
      code: res.code,
      message: res.message,
    });
  }

  return respondWithCache(JSON.stringify(res));
};
