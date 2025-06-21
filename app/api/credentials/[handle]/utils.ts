import { ErrorMessages, Platform } from "web3bio-profile-kit/types";
import { QueryType, queryIdentityGraph } from "@/utils/query";
import type {
  AuthHeaders,
  CredentialCategory,
  CredentialRecord,
  CredentialRecordRaw,
  CredentialsResponse,
} from "@/utils/types";
import { errorHandle, respondWithCache } from "@/utils/utils";

export const resolveCredentialsHandle = async (
  identity: string,
  platform: Platform,
  headers: AuthHeaders,
  pathname: string,
) => {
  try {
    const res = await queryIdentityGraph(
      QueryType.GET_CREDENTIALS_QUERY,
      identity,
      platform,
      headers,
    );

    // Early return if no identity data
    const vertices = res?.data?.identity?.identityGraph?.vertices;
    if (!vertices?.length) {
      return errorHandle({
        identity: identity,
        code: 404,
        path: pathname,
        platform: platform,
        message: ErrorMessages.NOT_FOUND,
      });
    }

    // Filter and sort credentials in one pass
    const targetId = `${platform},${identity}`;
    const credentials = (vertices as CredentialRecord[])
      .filter((vertex) => vertex.credentials?.length > 0)
      .sort((a, b) => {
        if (a.id === targetId) return -1;
        if (b.id === targetId) return 1;
        return 0;
      });

    if (credentials.length === 0) {
      return errorHandle({
        identity: identity,
        code: 404,
        path: pathname,
        platform: platform,
        message: ErrorMessages.NOT_FOUND,
      });
    }

    const response = buildCredentialsResponse(credentials);
    return respondWithCache(response);
  } catch (error) {
    return errorHandle({
      identity: identity,
      code: 500,
      path: pathname,
      platform: platform,
      message: ErrorMessages.NETWORK_ERROR,
    });
  }
};

// Optimized credential processing with better logic separation
const buildCredentialsResponse = (
  records: CredentialRecord[],
): CredentialsResponse[] => {
  return records.map((record) => {
    const credentialGroups = groupCredentialsByCategory(record.credentials);
    const processedCredentials = processCredentialGroups(credentialGroups);

    return {
      id: record.id,
      credentials: processedCredentials,
    };
  });
};

// Group credentials by category for efficient processing
const groupCredentialsByCategory = (
  credentials: CredentialRecordRaw[],
): Record<CredentialCategory, CredentialRecordRaw[]> => {
  const groups: Record<CredentialCategory, CredentialRecordRaw[]> = {
    isHuman: [],
    isRisky: [],
    isSpam: [],
  };

  for (const credential of credentials) {
    if (credential.category && groups[credential.category]) {
      const { category, ...sourceData } = credential;
      groups[credential.category].push(sourceData);
    }
  }

  return groups;
};

// Process each credential group with optimized logic
const processCredentialGroups = (
  groups: Record<CredentialCategory, CredentialRecordRaw[]>,
): Record<
  CredentialCategory,
  { value: boolean; sources: CredentialRecordRaw[] } | null
> => {
  const result: Record<
    CredentialCategory,
    { value: boolean; sources: CredentialRecordRaw[] } | null
  > = {
    isHuman: null,
    isRisky: null,
    isSpam: null,
  };

  // Process isHuman credentials
  if (groups.isHuman.length > 0) {
    result.isHuman = {
      value: calculateHumanValue(groups.isHuman),
      sources: groups.isHuman,
    };
  }

  // Process isRisky credentials
  if (groups.isRisky.length > 0) {
    result.isRisky = {
      value: true, // Any risky credential means risky
      sources: groups.isRisky,
    };
  }

  // Process isSpam credentials
  if (groups.isSpam.length > 0) {
    result.isSpam = {
      value: calculateSpamValue(groups.isSpam),
      sources: groups.isSpam,
    };
  }

  return result;
};

// Optimized human value calculation
const calculateHumanValue = (sources: CredentialRecordRaw[]): boolean => {
  // Check for high-trust sources first
  const hasTrustedSource = sources.some(
    (source) =>
      ["binance", "coinbase"].includes(source.dataSource) &&
      source.value === "true",
  );

  return hasTrustedSource || sources.length > 0;
};

// Optimized spam value calculation
const calculateSpamValue = (sources: CredentialRecordRaw[]): boolean => {
  return sources.some(
    (source) =>
      source.dataSource === "warpcast" &&
      source.type === "score" &&
      Number(source.value) === 0,
  );
};
