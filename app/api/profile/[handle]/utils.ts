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
  errorHandle,
  formatText,
  normalizeText,
  respondWithCache,
} from "@/utils/utils";
import { generateProfileStruct } from "@/utils/base";
import { processJson } from "../../search/utils";

// ============================================================================
// CONSTANTS
// ============================================================================

const DEFAULT_PLATFORM_ORDER = [
  Platform.ens,
  Platform.basenames,
  Platform.linea,
  Platform.ethereum,
  Platform.farcaster,
  Platform.lens,
  Platform.sns,
  Platform.solana,
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
  Platform.sns,
  Platform.solana,
]);

const SOCIAL_PLATFORMS = new Set([Platform.farcaster, Platform.lens]);

const INCLUSIVE_PLATFORMS = new Set([
  Platform.twitter,
  Platform.github,
  Platform.nextid,
]);

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

const isPrimaryOrSocialPlatform = (identity: IdentityRecord) =>
  identity.isPrimary || SOCIAL_PLATFORMS.has(identity.platform);

const isBadBasename = (
  platform: Platform,
  ownerAddress: string,
  resolvedAddress: string,
) => {
  return platform === Platform.basenames && ownerAddress !== resolvedAddress;
};

const isValidENSOrPrimaryFarcaster = (vertex: IdentityRecord) => {
  if (vertex.platform !== Platform.ens || vertex.isPrimaryFarcaster)
    return true;

  const vertexOwnerAddr = vertex.ownerAddress?.[0]?.address;
  const vertexResolvedAddr = vertex.resolvedAddress?.[0]?.address;
  return vertexOwnerAddr === vertexResolvedAddr;
};

const isVertexMatchingAddress = (
  vertex: IdentityRecord,
  sourceAddr: string,
  recordPlatform: Platform,
) => {
  if (!vertex.isPrimary && !SOCIAL_PLATFORMS.has(vertex.platform)) {
    return false;
  }

  if (INCLUSIVE_PLATFORMS.has(recordPlatform)) {
    return true;
  }

  if (vertex.platform === Platform.farcaster) {
    return (
      vertex.ownerAddress?.some((addr) =>
        isSameAddress(addr.address, sourceAddr),
      ) ?? false
    );
  }

  if ([Platform.sns, Platform.solana].includes(recordPlatform)) {
    return true;
  }

  return isSameAddress(vertex.resolvedAddress?.[0]?.address, sourceAddr);
};

// ============================================================================
// DEFAULT PROFILE
// ============================================================================

const createDefaultProfile = (resolvedRecord: IdentityRecord) => {
  const {
    identity,
    platform: recordPlatform,
    profile: recordProfile,
    isPrimary,
    registeredAt,
  } = resolvedRecord;

  if (recordProfile) {
    return { ...recordProfile, isPrimary, createdAt: registeredAt };
  }

  return {
    address: isWeb3Address(identity) ? identity : null,
    identity,
    platform: recordPlatform,
    displayName: isWeb3Address(identity) ? formatText(identity) : identity,
    registeredAt,
    isPrimary,
  };
};

const shouldAddDefaultProfile = (recordPlatform: Platform, results: any[]) => {
  if (
    recordPlatform === Platform.ethereum &&
    !results.some((x) => x.isPrimary && x.platform === Platform.ens)
  ) {
    return true;
  }

  if (
    recordPlatform === Platform.solana &&
    !results.some((x) => x.isPrimary && x.platform === Platform.sns)
  ) {
    return true;
  }

  if (
    !INCLUSIVE_PLATFORMS.has(recordPlatform) &&
    ![Platform.ethereum, Platform.solana].includes(recordPlatform)
  ) {
    return true;
  }

  return false;
};

// ============================================================================
// FILTERING RESPONSE
// ============================================================================

const filterPrimaryVertices = (
  vertices: IdentityRecord[],
  resolvedRecord: IdentityRecord,
) => {
  return vertices
    .filter((vertex) => {
      if (
        vertex.identity === resolvedRecord.identity &&
        vertex.platform === resolvedRecord.platform
      ) {
        return false;
      }

      if (!isPrimaryOrSocialPlatform(vertex)) return false;

      return isValidENSOrPrimaryFarcaster(vertex);
    })
    .map((vertex) => ({
      ...vertex.profile,
      isPrimary: vertex.isPrimary,
      createdAt: vertex.registeredAt,
    }));
};

const filterSecondaryVertices = (
  vertices: IdentityRecord[],
  resolvedRecord: IdentityRecord,
) => {
  const {
    identity,
    platform: recordPlatform,
    resolvedAddress,
  } = resolvedRecord;

  const sourceAddr = [Platform.ethereum, Platform.solana].includes(
    recordPlatform,
  )
    ? identity
    : resolvedAddress?.[0]?.address;

  return vertices
    .filter((vertex) =>
      isVertexMatchingAddress(vertex, sourceAddr, recordPlatform),
    )
    .map((vertex) => ({
      ...vertex.profile,
      isPrimary: vertex.isPrimary,
      createdAt: vertex.registeredAt,
    }));
};

const deduplicateAndFilter = (results: any[]) => {
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

// ============================================================================
// PROCESS RESULTS
// ============================================================================

const processPrimaryIdentity = (
  resolvedRecord: IdentityRecord,
  vertices: IdentityRecord[],
) => {
  const defaultReturn = createDefaultProfile(resolvedRecord);
  const firstOwnerAddress = resolvedRecord.ownerAddress?.[0]?.address;
  const firstResolvedAddress = resolvedRecord.resolvedAddress?.[0]?.address;

  if (
    isBadBasename(
      resolvedRecord.platform,
      firstOwnerAddress,
      firstResolvedAddress,
    )
  ) {
    return [defaultReturn];
  }

  let results = filterPrimaryVertices(vertices, resolvedRecord);

  if (DEFAULT_PLATFORM_ORDER.includes(defaultReturn.platform)) {
    return [...results, defaultReturn];
  }

  return results;
};

const processSecondaryIdentity = (
  resolvedRecord: IdentityRecord,
  vertices: IdentityRecord[],
) => {
  const defaultReturn = createDefaultProfile(resolvedRecord);
  let results = filterSecondaryVertices(vertices, resolvedRecord);

  if (shouldAddDefaultProfile(resolvedRecord.platform, results)) {
    return [...results, defaultReturn];
  }

  return results;
};

// ============================================================================
// CORE RESOLUTION FUNCTIONS
// ============================================================================

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

const sortProfilesByPlatform = (
  responses: ProfileRecord[],
  targetPlatform: Platform,
  handle: string,
): ProfileRecord[] => {
  const order = [
    targetPlatform === Platform.solana &&
    !responses.some((x) => x.platform === Platform.solana)
      ? Platform.sns
      : targetPlatform,
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

// ============================================================================
// EXPORTED MAIN FUNCTIONS
// ============================================================================

const getResolvedProfileArray = (data: IdentityGraphQueryResponse) => {
  const resolvedRecord = getResolvedRecord(data?.data?.identity);
  if (!resolvedRecord) return [];

  const vertices = resolvedRecord.identityGraph?.vertices || [];
  let results = [];

  if (isPrimaryOrSocialPlatform(resolvedRecord)) {
    results = processPrimaryIdentity(resolvedRecord, vertices);
  } else if (VALID_PLATFORMS.has(resolvedRecord.platform)) {
    results = processSecondaryIdentity(resolvedRecord, vertices);
  } else {
    results = [createDefaultProfile(resolvedRecord)];
  }

  return deduplicateAndFilter(results);
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
  ) as ProfileRecord[];
  const sortedProfiles = sortProfilesByPlatform(
    profilesArray,
    platform,
    handle,
  );

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
  pathname: string,
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
      path: pathname,
      platform: res.platform,
      code: res.code,
      message: res.message,
    });
  }

  return respondWithCache(res);
};
