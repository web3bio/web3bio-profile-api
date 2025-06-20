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
import {
  generateProfileStruct,
  processJson,
  SOCIAL_PLATFORMS,
} from "@/utils/base";

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
] as const;

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

const INCLUSIVE_PLATFORMS = new Set([
  Platform.twitter,
  Platform.github,
  Platform.nextid,
]);
const ADDRESS_PLATFORMS = new Set([Platform.ethereum, Platform.solana]);
const SNS_PLATFORMS = new Set([Platform.sns, Platform.solana]);

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

const isPrimaryOrSocial = (identity: IdentityRecord): boolean =>
  identity.isPrimary || SOCIAL_PLATFORMS.has(identity.platform);

const isValidENS = (vertex: IdentityRecord): boolean => {
  if (vertex.platform !== Platform.ens || vertex.isPrimaryFarcaster)
    return true;

  const ownerAddr = vertex.ownerAddress?.[0]?.address;
  const resolvedAddr = vertex.resolvedAddress?.[0]?.address;
  return ownerAddr === resolvedAddr;
};

const matchesAddress = (
  vertex: IdentityRecord,
  sourceAddr: string,
  platform: Platform,
): boolean => {
  if (!vertex.isPrimary && !SOCIAL_PLATFORMS.has(vertex.platform)) return false;
  if (INCLUSIVE_PLATFORMS.has(platform)) return true;
  if (SNS_PLATFORMS.has(platform)) return true;

  if (vertex.platform === Platform.farcaster) {
    return (
      vertex.ownerAddress?.some((addr) =>
        isSameAddress(addr.address, sourceAddr),
      ) ?? false
    );
  }

  return isSameAddress(vertex.resolvedAddress?.[0]?.address, sourceAddr);
};

// ============================================================================
// PROFILE CREATION
// ============================================================================

const createProfile = (record: IdentityRecord) => {
  const { identity, platform, profile, isPrimary, registeredAt } = record;

  if (profile) {
    return { ...profile, isPrimary, createdAt: registeredAt };
  }

  return {
    address: isWeb3Address(identity) ? identity : null,
    identity,
    platform,
    displayName: isWeb3Address(identity) ? formatText(identity) : identity,
    registeredAt,
    isPrimary,
  };
};

const needsDefaultProfile = (platform: Platform, results: any[]): boolean => {
  const hasPrimaryENS = results.some(
    (x) => x.isPrimary && x.platform === Platform.ens,
  );
  const hasPrimarySNS = results.some(
    (x) => x.isPrimary && x.platform === Platform.sns,
  );

  const isInclusive =
    platform === Platform.twitter ||
    platform === Platform.github ||
    platform === Platform.nextid;
  const isWeb3 = platform === Platform.ethereum || platform === Platform.solana;

  return (
    (platform === Platform.ethereum && !hasPrimaryENS) ||
    (platform === Platform.solana && !hasPrimarySNS) ||
    (!isInclusive && !isWeb3)
  );
};

// ============================================================================
// FILTERING AND PROCESSING
// ============================================================================

const filterVertices = (
  vertices: IdentityRecord[],
  resolvedRecord: IdentityRecord,
  isPrimary: boolean,
): any[] => {
  const sourceAddr = ADDRESS_PLATFORMS.has(resolvedRecord.platform)
    ? resolvedRecord.identity
    : resolvedRecord.resolvedAddress?.[0]?.address;

  return vertices
    .filter((vertex) => {
      // Skip self
      if (
        vertex.identity === resolvedRecord.identity &&
        vertex.platform === resolvedRecord.platform
      ) {
        return false;
      }

      if (isPrimary) {
        return isPrimaryOrSocial(vertex) && isValidENS(vertex);
      }

      return matchesAddress(vertex, sourceAddr, resolvedRecord.platform);
    })
    .map((vertex) => ({
      ...vertex.profile,
      isPrimary: vertex.isPrimary,
      createdAt: vertex.registeredAt,
    }));
};

const processIdentity = (
  resolvedRecord: IdentityRecord,
  vertices: IdentityRecord[],
) => {
  const defaultProfile = createProfile(resolvedRecord);

  // Check for bad basename
  const ownerAddr = resolvedRecord.ownerAddress?.[0]?.address;
  const resolvedAddr = resolvedRecord.resolvedAddress?.[0]?.address;

  if (
    resolvedRecord.platform === Platform.basenames &&
    ownerAddr !== resolvedAddr
  ) {
    return [defaultProfile];
  }

  const isPrimaryFlow = isPrimaryOrSocial(resolvedRecord);
  let results = filterVertices(vertices, resolvedRecord, isPrimaryFlow);

  // Add default profile when needed
  const isDefaultPlatform = DEFAULT_PLATFORM_ORDER.some(
    (p) => p === defaultProfile.platform,
  );

  if (isPrimaryFlow && isDefaultPlatform) {
    results.push(defaultProfile);
  } else if (
    !isPrimaryFlow &&
    needsDefaultProfile(resolvedRecord.platform, results)
  ) {
    results.push(defaultProfile);
  }

  return results;
};

const deduplicateProfiles = (profiles: any[]) => {
  const seen = new Set<string>();
  return profiles.filter((profile) => {
    if (!profile.platform) return false;

    // Type-safe platform check
    const platformValues = Object.values(Platform);
    if (!platformValues.includes(profile.platform)) return false;

    try {
      if (!isSupportedPlatform(profile.platform as any)) return false;
    } catch {
      return false;
    }

    const key = `${profile.platform}:${profile.identity}`;
    if (seen.has(key)) return false;

    seen.add(key);
    return true;
  });
};

// ============================================================================
// CORE RESOLUTION
// ============================================================================

const processResolvedRecord = (
  identity: IdentityRecord,
): IdentityRecord | null => {
  if (!identity) return null;

  const record = { ...identity };
  const vertices = record.identityGraph?.vertices || [];

  // Handle Farcaster-ENS relationships
  const farcasterENSEntries = vertices.filter(
    (vertex) =>
      vertex.platform === Platform.ens &&
      !vertex.isPrimary &&
      vertices.some(
        (v) =>
          v.platform === Platform.farcaster && v.identity === vertex.identity,
      ),
  );

  if (farcasterENSEntries.length > 0) {
    farcasterENSEntries.forEach((entry) => {
      entry.isPrimary = true;
      entry.isPrimaryFarcaster = true;
    });
    record.isPrimary = true;
  }

  return record;
};

const sortProfiles = (
  profiles: ProfileRecord[],
  targetPlatform: Platform,
  handle: string,
): ProfileRecord[] => {
  const normalizedHandle = normalizeText(handle);

  // Find exact match
  const exactMatch = profiles.find(
    (p) => p.identity === normalizedHandle && p.platform === targetPlatform,
  );

  // Group by platform
  const platformGroups = new Map<Platform, ProfileRecord[]>();

  profiles.forEach((profile) => {
    if (
      profile.identity === normalizedHandle &&
      profile.platform === targetPlatform
    ) {
      return; // Skip exact match as we handle it separately
    }

    if (!profile.platform) {
      return;
    }

    const platformIndex = DEFAULT_PLATFORM_ORDER.findIndex(
      (p) => p === profile.platform,
    );
    if (platformIndex === -1) {
      return;
    }

    const platform = profile.platform;
    if (!platformGroups.has(platform)) {
      platformGroups.set(platform, []);
    }
    platformGroups.get(platform)!.push(profile);
  });

  // Sort each group
  platformGroups.forEach((group) => {
    group.sort((a, b) => {
      if (a.isPrimary !== b.isPrimary) {
        return a.isPrimary ? -1 : 1;
      }

      const aTime = a.createdAt
        ? new Date(a.createdAt).getTime()
        : Number.MAX_SAFE_INTEGER;
      const bTime = b.createdAt
        ? new Date(b.createdAt).getTime()
        : Number.MAX_SAFE_INTEGER;
      return aTime - bTime;
    });
  });

  // Build ordered result
  const platformOrder = [
    targetPlatform === Platform.solana &&
    !profiles.some((p) => p.platform === Platform.solana)
      ? Platform.sns
      : targetPlatform,
    ...DEFAULT_PLATFORM_ORDER.filter((p) => p !== targetPlatform),
  ];

  const sortedProfiles = platformOrder
    .filter((platform) => platformGroups.has(platform))
    .flatMap((platform) => platformGroups.get(platform)!);

  return [exactMatch, ...sortedProfiles].filter(Boolean) as ProfileRecord[];
};

// ============================================================================
// MAIN FUNCTIONS
// ============================================================================

const getProfileArray = (data: IdentityGraphQueryResponse): ProfileRecord[] => {
  const resolvedRecord = processResolvedRecord(data?.data?.identity);
  if (!resolvedRecord) return [];

  const vertices = resolvedRecord.identityGraph?.vertices || [];

  let results: any[];
  if (
    isPrimaryOrSocial(resolvedRecord) ||
    VALID_PLATFORMS.has(resolvedRecord.platform)
  ) {
    results = processIdentity(resolvedRecord, vertices);
  } else {
    results = [createProfile(resolvedRecord)];
  }

  return deduplicateProfiles(results);
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
  // Handle errors
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
      message: response.errors || ErrorMessages.NOT_FOUND,
      code: response.errors ? 500 : 404,
    };
  }

  const processedResponse = await processJson(response);
  const profilesArray = getProfileArray(processedResponse);
  const sortedProfiles = sortProfiles(profilesArray, platform, handle);

  // Generate profile structs
  const results = await Promise.allSettled(
    sortedProfiles.map((profile) =>
      generateProfileStruct(
        profile as ProfileRecord,
        ns,
        response.data.identity.identityGraph?.edges,
      ),
    ),
  );

  const validResults = results
    .filter(
      (
        result,
      ): result is PromiseFulfilledResult<ProfileResponse | NSResponse> =>
        result.status === "fulfilled",
    )
    .map((result) => result.value);

  // Ethereum fallback
  if (!validResults.length && platform === Platform.ethereum) {
    const fallbackProfile = {
      address: handle,
      identity: handle,
      platform: Platform.ethereum,
      displayName: formatText(handle),
      avatar: null,
      description: null,
      ...(ns ? {} : { email: null, location: null, header: null, links: {} }),
    };
    validResults.push(fallbackProfile as ProfileResponse | NSResponse);
  }

  // Remove duplicates
  const uniqueResults = validResults.filter(
    (item, index, self) =>
      index ===
      self.findIndex(
        (x) => x.platform === item.platform && x.identity === item.identity,
      ),
  ) as ProfileResponse[];

  return uniqueResults.length && !uniqueResults.every((x) => x?.error)
    ? uniqueResults
    : {
        identity: handle,
        code: 404,
        message: uniqueResults[0]?.error || ErrorMessages.NOT_FOUND,
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

  const result = await resolveWithIdentityGraph({
    handle,
    platform,
    ns,
    response,
  });

  if ("message" in result) {
    return errorHandle({
      identity: result.identity,
      path: pathname,
      platform: result.platform,
      code: result.code,
      message: result.message,
    });
  }

  return respondWithCache(result);
};
