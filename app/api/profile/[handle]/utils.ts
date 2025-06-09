import {
  ErrorMessages,
  NSResponse,
  Platform,
  ProfileResponse,
} from "web3bio-profile-kit/types";
import {
  isSameAddress,
  isSupportedPlatform,
  isWeb3Address,
} from "web3bio-profile-kit/utils";
import { QueryType, queryIdentityGraph } from "@/utils/query";
import type {
  AuthHeaders,
  IdentityGraphQueryResponse,
  IdentityRecord,
  ProfileRecord,
} from "@/utils/types";
import {
  PLATFORMS_TO_EXCLUDE,
  errorHandle,
  formatText,
  normalizeText,
  respondWithCache,
} from "@/utils/utils";
import { generateProfileStruct } from "@/utils/base";
import { processJson } from "../../graph/utils";

// Constantsa
const DEFAULT_PLATFORM_ORDER = [
  Platform.ens,
  Platform.basenames,
  Platform.linea,
  Platform.ethereum,
  Platform.farcaster,
  Platform.lens,
];

const VALID_PLATFORMS = new Set([
  Platform.ethereum,
  Platform.ens,
  Platform.basenames,
  Platform.linea,
  Platform.unstoppableDomains,
  Platform.dotbit,
  Platform.twitter,
  Platform.github,
  Platform.nextid,
]);

const SOCIAL_PLATFORMS = new Set([Platform.farcaster, Platform.lens]);
const INCLUSIVE_PLATFORMS = new Set([
  Platform.twitter,
  Platform.github,
  Platform.nextid,
]);

const isPrimaryOrSocialPlatform = (identity: IdentityRecord) =>
  identity.isPrimary || SOCIAL_PLATFORMS.has(identity.platform);

const sortProfilesByPlatform = (
  responses: ProfileRecord[],
  targetPlatform: Platform,
  handle: string,
): ProfileRecord[] => {
  const order = [
    targetPlatform,
    ...DEFAULT_PLATFORM_ORDER.filter((x) => x !== targetPlatform),
  ];
  const normalizedHandle = normalizeText(handle);

  const exactMatch = responses.find(
    (x) => x.identity === normalizedHandle && x.platform === targetPlatform,
  );

  const responsesByPlatform = responses
    .filter(
      (response) =>
        !(
          response.identity === normalizedHandle &&
          response.platform === targetPlatform
        ) && DEFAULT_PLATFORM_ORDER.includes(response.platform as Platform),
    )
    .reduce(
      (acc, response) => {
        const platform = response.platform as Platform;
        if (!acc[platform]) {
          acc[platform] = [];
        }
        acc[platform].push(response);
        return acc;
      },
      {} as Record<Platform, ProfileRecord[]>,
    );

  Object.keys(responsesByPlatform).forEach((platform) => {
    responsesByPlatform[platform as Platform].sort((a, b) => {
      if (a.isPrimary && !b.isPrimary) return -1;
      if (!a.isPrimary && b.isPrimary) return 1;

      const aDate = a.createdAt
        ? new Date(a.createdAt).getTime()
        : Number.MAX_SAFE_INTEGER;
      const bDate = b.createdAt
        ? new Date(b.createdAt).getTime()
        : Number.MAX_SAFE_INTEGER;
      return aDate - bDate;
    });
  });

  const sortedResponses = order
    .filter((platform) => responsesByPlatform[platform])
    .flatMap((platform) => responsesByPlatform[platform]);

  return [exactMatch, ...sortedResponses].filter(Boolean) as ProfileRecord[];
};

const getResolvedRecord = (identity: IdentityRecord) => {
  if (!identity) return null;

  const res = { ...identity };
  const vertices = res.identityGraph?.vertices || [];

  // Process Farcaster-ENS relationships
  const farcasterEqualENSEntries = vertices
    .filter((x) => x.platform === Platform.ens && !x.isPrimary)
    .map((x) => {
      if (
        vertices.some(
          (i) => i.platform === Platform.farcaster && i.identity === x.identity,
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
  platform: Platform,
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
    registeredAt,
  } = resolvedRecord;
  const firstResolvedAddress = resolvedAddress?.[0]?.address;
  const firstOwnerAddress = ownerAddress?.[0]?.address;
  const defaultReturn = profile
    ? { ...profile, isPrimary, createdAt: registeredAt }
    : {
        address: isWeb3Address(identity) ? identity : null,
        identity,
        platform: recordPlatform,
        displayName: isWeb3Address(identity) ? formatText(identity) : identity,
        registeredAt,
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
    recordPlatform === Platform.basenames &&
    firstOwnerAddress !== firstResolvedAddress;

  if (isPrimaryOrSocialPlatform(resolvedRecord) && !isBadBasename) {
    // Direct pass case
    results = vertices
      .filter((vertex) => {
        if (
          vertex.identity === resolvedRecord.identity &&
          vertex.platform === resolvedRecord.platform
        )
          return false;
        if (!isPrimaryOrSocialPlatform(vertex)) return false;
        if (vertex.platform === Platform.ens && !vertex.isPrimaryFarcaster) {
          const vertexOwnerAddr = vertex.ownerAddress?.[0]?.address;
          const vertexResolvedAddr = vertex.resolvedAddress?.[0]?.address;
          return vertexOwnerAddr === vertexResolvedAddr;
        }
        return true;
      })
      .map((vertex) => {
        if (vertex.platform === Platform.farcaster) {
        }
        return {
          ...vertex.profile,
          isPrimary: vertex.isPrimary,
          createdAt: vertex.registeredAt,
        };
      });
    if (DEFAULT_PLATFORM_ORDER.includes(defaultReturn.platform)) {
      results = [...results, defaultReturn];
    }
  } else if (VALID_PLATFORMS.has(recordPlatform)) {
    // Get source address for comparison
    const sourceAddr =
      recordPlatform === Platform.ethereum ? identity : firstResolvedAddress;

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
        if (vertex.platform === Platform.farcaster) {
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
      (recordPlatform === Platform.ethereum &&
        !results.some((x) => x.isPrimary && x.platform === Platform.ens)) ||
      !(
        INCLUSIVE_PLATFORMS.has(recordPlatform) ||
        recordPlatform === Platform.ethereum
      );

    if (shouldAddDefault) {
      results = [...results, defaultReturn];
    }
  } else {
    results = [defaultReturn];
  }

  // Filter duplicates and sort by primary status
  return results
    .filter((x) => isSupportedPlatform(x.platform))
    .filter(
      (item, index, self) =>
        index ===
        self.findIndex(
          (i) => i.platform === item.platform && i.identity === item.identity,
        ),
    );
};

export const resolveWithIdentityGraph = async ({
  handle,
  platform,
  ns,
  response,
}: {
  handle: string;
  platform: Platform;
  ns?: boolean;
  response: IdentityGraphQueryResponse;
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
      message: response.errors ? response.errors : ErrorMessages.NOT_FOUND,
      code: response.errors ? 500 : 404,
    };
  }

  const resolvedResponse = await processJson(response);
  const profilesArray = getResolvedProfileArray(
    resolvedResponse,
    platform,
  ) as ProfileRecord[];
  const sortedProfiles = PLATFORMS_TO_EXCLUDE.includes(platform)
    ? profilesArray
    : sortProfilesByPlatform(profilesArray, platform, handle);

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
      (
        result,
      ): result is PromiseFulfilledResult<ProfileResponse | NSResponse> =>
        result.status === "fulfilled",
    )
    .map((result) => result.value);

  // Handle Ethereum fallback
  if (!returnRes.length && platform === Platform.ethereum) {
    const nsObj = {
      address: handle,
      identity: handle,
      platform: Platform.ethereum,
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
          } as ProfileResponse),
    );
  }

  // Remove duplicates
  const uniqRes = returnRes.filter(
    (item, index, self) =>
      index ===
      self.findIndex(
        (x) => x.platform === item.platform && x.identity === item.identity,
      ),
  ) as ProfileResponse[];

  return uniqRes.length && !uniqRes.every((x) => x?.error)
    ? uniqRes
    : {
        identity: handle,
        code: 404,
        message: uniqRes[0]?.error || ErrorMessages.NOT_FOUND,
        platform,
      };
};

export const resolveUniversalHandle = async (
  handle: string,
  platform: Platform,
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
