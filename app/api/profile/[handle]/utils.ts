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
  respondJson,
} from "@/utils/utils";
import {
  generateProfileStruct,
  processJson,
  SOCIAL_PLATFORMS,
} from "@/utils/base";

const PLATFORM_PRIORITY_ORDER = [
  Platform.ens,
  Platform.basenames,
  Platform.linea,
  Platform.ethereum,
  Platform.farcaster,
  Platform.lens,
  Platform.sns,
  Platform.solana,
] as const;

const SUPPORTED_PLATFORMS = new Set([
  Platform.ethereum,
  Platform.ens,
  Platform.basenames,
  Platform.linea,
  Platform.unstoppableDomains,
  Platform.twitter,
  Platform.github,
  Platform.discord,
  Platform.linkedin,
  Platform.nextid,
  Platform.sns,
  Platform.solana,
  Platform.instagram,
  Platform.reddit,
  Platform.keybase,
  Platform.linkedin,
  Platform.facebook,
  Platform.telegram,
  Platform.nostr,
  Platform.bluesky,
]);

const SOCIAL_MEDIA_PLATFORMS = new Set([
  Platform.twitter,
  Platform.github,
  Platform.discord,
  Platform.linkedin,
  Platform.instagram,
  Platform.facebook,
  Platform.telegram,
  Platform.reddit,
  Platform.bluesky,
  Platform.keybase,
  Platform.nostr,
  Platform.nextid,
]);

const WEB3_ADDRESS_PLATFORMS = new Set([Platform.ethereum, Platform.solana]);
const SOLANA_ECOSYSTEM_PLATFORMS = new Set([Platform.sns, Platform.solana]);
const PLATFORM_PRIORITY_MAP = new Map(
  PLATFORM_PRIORITY_ORDER.map((platform, index) => [platform, index]),
);
const VALID_PLATFORM_SET = new Set(Object.values(Platform));

const isPrimaryOrSocialProfile = (identity: IdentityRecord): boolean =>
  identity.isPrimary || SOCIAL_PLATFORMS.has(identity.platform);

const isValidEnsRecord = (record: IdentityRecord): boolean => {
  if (record.platform !== Platform.ens || record.isPrimaryFarcaster) {
    return true;
  }

  const ownerAddress = record.ownerAddress?.[0]?.address;
  const resolvedAddress = record.resolvedAddress?.[0]?.address;
  return ownerAddress === resolvedAddress;
};

const isAddressMatching = (
  record: IdentityRecord,
  sourceAddress: string,
  sourcePlatform: Platform,
): boolean => {
  if (!record.isPrimary && !SOCIAL_PLATFORMS.has(record.platform)) {
    return false;
  }

  if (
    SOCIAL_MEDIA_PLATFORMS.has(sourcePlatform) ||
    SOLANA_ECOSYSTEM_PLATFORMS.has(sourcePlatform)
  ) {
    return true;
  }

  if (record.platform === Platform.farcaster) {
    return (
      record.ownerAddress?.some((addr) =>
        isSameAddress(addr.address, sourceAddress),
      ) ?? false
    );
  }

  return isSameAddress(
    record.resolvedAddress?.[0]?.address,
    sourceAddress || "",
  );
};

const buildProfileFromRecord = (record: IdentityRecord): ProfileRecord => {
  const { identity, platform, profile, isPrimary, registeredAt } = record;

  if (profile) {
    return {
      ...profile,
      isPrimary,
      createdAt: registeredAt,
    };
  }

  return {
    address: isWeb3Address(identity) ? identity : "",
    identity,
    platform,
    displayName: isWeb3Address(identity) ? formatText(identity) : identity,
    registeredAt,
    isPrimary,
    uid: "",
    avatar: null,
    contenthash: "",
    description: "",
    network: "",
    social: {} as any,
    texts: {},
    addresses: [],
  } as ProfileRecord;
};

const shouldAddDefaultProfile = (
  platform: Platform,
  existingProfiles: ProfileRecord[],
): boolean => {
  if (platform === Platform.ethereum) {
    return !existingProfiles.some(
      (profile) => profile.isPrimary && profile.platform === Platform.ens,
    );
  }

  if (platform === Platform.solana) {
    return !existingProfiles.some(
      (profile) => profile.isPrimary && profile.platform === Platform.sns,
    );
  }

  const isSocialMedia = SOCIAL_MEDIA_PLATFORMS.has(platform);
  const isWeb3Address = WEB3_ADDRESS_PLATFORMS.has(platform);

  return !isSocialMedia && !isWeb3Address;
};

const filterConnectedProfiles = (
  allRecords: IdentityRecord[],
  targetRecord: IdentityRecord,
  usePrimaryFlow: boolean,
): ProfileRecord[] => {
  const sourceAddress = WEB3_ADDRESS_PLATFORMS.has(targetRecord.platform)
    ? targetRecord.identity
    : targetRecord.resolvedAddress?.[0]?.address;

  return allRecords
    .filter((record) => {
      if (
        record.identity === targetRecord.identity &&
        record.platform === targetRecord.platform
      ) {
        return false;
      }

      return usePrimaryFlow
        ? isPrimaryOrSocialProfile(record) && isValidEnsRecord(record)
        : isAddressMatching(record, sourceAddress, targetRecord.platform);
    })
    .map((record) => ({
      ...record.profile,
      isPrimary: record.isPrimary,
      createdAt: record.registeredAt,
    }));
};

const processIdentityConnections = (
  targetRecord: IdentityRecord,
  allRecords: IdentityRecord[],
): ProfileRecord[] => {
  const defaultProfile = buildProfileFromRecord(targetRecord);
  // Handle invalid Basenames configuration
  if (targetRecord.platform === Platform.basenames) {
    const ownerAddress = targetRecord.ownerAddress?.[0]?.address;
    const resolvedAddress = targetRecord.resolvedAddress?.[0]?.address;

    if (ownerAddress !== resolvedAddress) {
      return [defaultProfile];
    }
  }

  const usePrimaryFlow = isPrimaryOrSocialProfile(targetRecord);
  const connectedProfiles = filterConnectedProfiles(
    allRecords,
    targetRecord,
    usePrimaryFlow,
  );

  // Add default profile when appropriate
  const shouldAddDefault = usePrimaryFlow
    ? PLATFORM_PRIORITY_MAP.has(defaultProfile.platform as any)
    : shouldAddDefaultProfile(targetRecord.platform, connectedProfiles);

  if (shouldAddDefault) {
    connectedProfiles.push(defaultProfile);
  }

  return connectedProfiles;
};

const removeDuplicateProfiles = (
  profiles: ProfileRecord[],
): ProfileRecord[] => {
  const uniqueProfilesMap = new Map<string, ProfileRecord>();

  for (const profile of profiles) {
    if (!profile.platform || !VALID_PLATFORM_SET.has(profile.platform)) {
      continue;
    }

    if (!isSupportedPlatform(profile.platform as any)) {
      continue;
    }

    const profileKey = `${profile.platform}:${profile.identity}`;
    if (!uniqueProfilesMap.has(profileKey)) {
      uniqueProfilesMap.set(profileKey, profile);
    }
  }

  return Array.from(uniqueProfilesMap.values());
};

const enrichWithFarcasterEnsRelations = (
  identity: IdentityRecord,
): IdentityRecord | null => {
  if (!identity) return null;

  const graphVertices = identity.identityGraph?.vertices;
  if (!graphVertices) return identity;

  // Find ENS entries linked to Farcaster profiles
  const farcasterLinkedEnsEntries = graphVertices.filter(
    (vertex) =>
      vertex.platform === Platform.ens &&
      !vertex.isPrimary &&
      graphVertices.some(
        (otherVertex) =>
          otherVertex.platform === Platform.farcaster &&
          otherVertex.identity === vertex.identity,
      ),
  );

  if (farcasterLinkedEnsEntries.length > 0) {
    // Mark ENS entries as primary when linked to Farcaster
    farcasterLinkedEnsEntries.forEach((entry) => {
      entry.isPrimary = true;
      entry.isPrimaryFarcaster = true;
    });
    identity.isPrimary = true;
  }

  return identity;
};

const sortProfilesByPriority = (
  profiles: ProfileRecord[],
  primaryPlatform: Platform,
  targetHandle: string,
): ProfileRecord[] => {
  if (profiles.length === 0) return profiles;

  const normalizedHandle = normalizeText(targetHandle);
  let exactMatchProfile: ProfileRecord | undefined;
  const platformGroups = new Map<Platform, ProfileRecord[]>();

  // Group profiles and find exact match
  for (const profile of profiles) {
    if (
      profile.identity === normalizedHandle &&
      profile.platform === primaryPlatform
    ) {
      exactMatchProfile = profile;
      continue;
    }

    if (
      !profile.platform ||
      !PLATFORM_PRIORITY_MAP.has(profile.platform as any)
    ) {
      continue;
    }

    if (!platformGroups.has(profile.platform)) {
      platformGroups.set(profile.platform, []);
    }
    platformGroups.get(profile.platform)!.push(profile);
  }

  // Sort profiles within each platform group
  for (const profileGroup of platformGroups.values()) {
    profileGroup.sort((a, b) => {
      if (a.isPrimary !== b.isPrimary) {
        return a.isPrimary ? -1 : 1;
      }
      const timeA = a.createdAt
        ? new Date(a.createdAt).getTime()
        : Number.MAX_SAFE_INTEGER;
      const timeB = b.createdAt
        ? new Date(b.createdAt).getTime()
        : Number.MAX_SAFE_INTEGER;
      return timeA - timeB;
    });
  }

  // Build final ordered result
  const primaryPlatformOrFallback =
    primaryPlatform === Platform.solana && !platformGroups.has(Platform.solana)
      ? Platform.sns
      : primaryPlatform;

  const sortedProfiles = platformGroups.get(primaryPlatformOrFallback) || [];
  for (const platform of PLATFORM_PRIORITY_ORDER) {
    if (
      platform !== primaryPlatformOrFallback &&
      platformGroups.has(platform)
    ) {
      sortedProfiles.push(...platformGroups.get(platform)!);
    }
  }

  return exactMatchProfile
    ? [exactMatchProfile, ...sortedProfiles]
    : sortedProfiles;
};

const extractProfilesFromGraph = (
  data: IdentityGraphQueryResponse,
): ProfileRecord[] => {
  const enrichedRecord = enrichWithFarcasterEnsRelations(data?.data?.identity);
  if (!enrichedRecord) return [];
  const graphVertices =
    enrichedRecord.identityGraph?.vertices?.map((v) => ({
      ...v,
      profile: {
        ...v.profile,
        aliases: v.aliases || [],
      },
    })) || [];

  const profileResults =
    isPrimaryOrSocialProfile(enrichedRecord) ||
    SUPPORTED_PLATFORMS.has(enrichedRecord.platform)
      ? processIdentityConnections(enrichedRecord, graphVertices)
      : [buildProfileFromRecord(enrichedRecord)];
  return removeDuplicateProfiles(profileResults);
};

export const resolveWithIdentityGraph = async ({
  handle,
  platform,
  ns,
  response,
  pathname,
}: {
  handle: string;
  platform: Platform;
  response: IdentityGraphQueryResponse;

  ns?: boolean;
  pathname?: string;
}) => {
  // Handle error responses early
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
      code: response.code ? response.code : response.errors ? 500 : 404,
    };
  }

  const processedResponse = await processJson(response);
  const extractedProfiles = extractProfilesFromGraph(processedResponse);
  // kill eth or solana profile if the address is included in other profiles
  const ethSolanaIndex = extractedProfiles.findIndex((profile) =>
    [Platform.ethereum, Platform.solana].includes(profile.platform),
  );

  if (ethSolanaIndex !== -1) {
    const ethSolanaProfile = extractedProfiles[ethSolanaIndex];
    const hasAddressConflict = extractedProfiles.some(
      (profile, index) =>
        index !== ethSolanaIndex &&
        profile.address === ethSolanaProfile.address,
    );

    if (hasAddressConflict) {
      extractedProfiles.splice(ethSolanaIndex, 1);
    }
  }
  const sortedProfiles = sortProfilesByPriority(
    extractedProfiles,
    platform,
    handle,
  );

  const allAliases = pathname?.startsWith("/profile/")
    ? response.data.identity.identityGraph?.vertices?.reduce((pre, cur) => {
        if (
          cur.aliases &&
          cur.aliases?.length > 0 &&
          cur.platform === Platform.farcaster
        ) {
          const res = pre.concat(pre, cur.aliases as string[]);
          pre = res;
        }
        return pre;
      }, [] as string[])
    : [];

  // Generate profile structures
  const profileStructPromises = sortedProfiles.map((profile) =>
    generateProfileStruct(
      profile,
      ns,
      response.data.identity.identityGraph?.edges,
      allAliases,
    ),
  );

  const profileResults = await Promise.allSettled(profileStructPromises);
  const validProfiles = profileResults
    .filter(
      (
        result,
      ): result is PromiseFulfilledResult<ProfileResponse | NSResponse> =>
        result.status === "fulfilled",
    )
    .map((result) => result.value);

  return validProfiles.length > 0
    ? validProfiles
    : {
        identity: handle,
        code: 404,
        message: ErrorMessages.NOT_FOUND,
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

  const resolutionResult = await resolveWithIdentityGraph({
    handle,
    platform,
    ns,
    response,
    pathname,
  });

  if ("message" in resolutionResult) {
    return errorHandle({
      identity: resolutionResult.identity,
      path: pathname,
      platform: resolutionResult.platform,
      code: resolutionResult.code,
      message: resolutionResult.message,
    });
  }

  return respondJson(resolutionResult);
};
