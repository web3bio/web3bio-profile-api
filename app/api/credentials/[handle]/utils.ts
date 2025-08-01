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

    const vertices = res?.data?.identity?.identityGraph?.vertices as
      | CredentialRecord[]
      | undefined;

    if (!vertices?.length) {
      return errorHandle({
        identity,
        code: 404,
        path: pathname,
        platform,
        message: ErrorMessages.NOT_FOUND,
      });
    }

    const targetId = `${platform},${identity}`;

    const credentials = vertices
      .filter((v) => v.credentials?.length || v.id === targetId)
      .sort((a, b) => {
        if (a.id === targetId) return -1;
        if (b.id === targetId) return 1;
        return 0;
      });

    return respondWithCache(buildCredentialsResponse(credentials));
  } catch (error) {
    console.error("Error in resolveCredentialsHandle:", error);
    return errorHandle({
      identity,
      code: 500,
      path: pathname,
      platform,
      message: ErrorMessages.NETWORK_ERROR,
    });
  }
};

const buildCredentialsResponse = (
  records: CredentialRecord[],
): CredentialsResponse[] =>
  records.map((record) => ({
    id: record.id,
    credentials: record.credentials
      ? processCredentials(record.credentials)
      : null,
  }));

const processCredentials = (
  credentials: CredentialRecordRaw[],
): Record<
  CredentialCategory,
  { value: boolean; sources: CredentialRecordRaw[] } | null
> => {
  const groups: Record<CredentialCategory, CredentialRecordRaw[]> = {
    isHuman: [],
    isRisky: [],
    isSpam: [],
  };

  for (const credential of credentials) {
    if (credential.category && groups[credential.category]) {
      groups[credential.category].push(credential);
    }
  }

  return {
    isHuman:
      groups.isHuman.length === 0
        ? null
        : {
            value: checkIsHuman(groups.isHuman),
            sources: groups.isHuman,
          },
    isRisky:
      groups.isRisky.length === 0
        ? null
        : {
            value: checkIsRisky(groups.isRisky),
            sources: groups.isRisky,
          },
    isSpam:
      groups.isSpam.length === 0
        ? null
        : {
            value: checkIsSpam(groups.isSpam),
            sources: groups.isSpam,
          },
  };
};

const checkIsHuman = (sources: CredentialRecordRaw[]): boolean => {
  return sources.some((source) => source.value === "true");
};

const checkIsRisky = (sources: CredentialRecordRaw[]): boolean => {
  return Boolean(sources.length);
};

const checkIsSpam = (sources: CredentialRecordRaw[]): boolean => {
  return sources.some(
    (source) =>
      source.dataSource === "warpcast" &&
      source.type === "score" &&
      Number(source.value) === 0,
  );
};
