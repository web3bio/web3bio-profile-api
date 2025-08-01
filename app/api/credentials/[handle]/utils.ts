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
      .sort((a, b) => (a.id === targetId ? -1 : b.id === targetId ? 1 : 0));

    return respondWithCache(buildCredentialsResponse(credentials));
  } catch {
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
    credentials:
      (record.credentials &&
        processCredentialGroups(
          groupCredentialsByCategory(record.credentials),
        )) ||
      null,
  }));

const groupCredentialsByCategory = (
  credentials: CredentialRecordRaw[],
): Record<CredentialCategory, CredentialRecordRaw[]> => {
  const groups: Record<CredentialCategory, CredentialRecordRaw[]> = {
    isHuman: [],
    isRisky: [],
    isSpam: [],
  };
  for (const c of credentials) {
    if (c.category && groups[c.category]) groups[c.category].push(c);
  }
  return groups;
};

const processCredentialGroups = (
  groups: Record<CredentialCategory, CredentialRecordRaw[]>,
): Record<
  CredentialCategory,
  { value: boolean; sources: CredentialRecordRaw[] } | null
> => ({
  isHuman: !groups.isHuman.length
    ? null
    : {
        value: Boolean(resolveIsHuman(groups.isHuman).length),
        sources: resolveIsHuman(groups.isHuman),
      },
  isRisky: !groups.isRisky.length
    ? null
    : {
        value: Boolean(resolveIsRisky(groups.isRisky).length),
        sources: resolveIsRisky(groups.isRisky),
      },
  isSpam: !groups.isSpam.length
    ? null
    : {
        value: Boolean(resolveIsSpam(groups.isSpam).length),
        sources: resolveIsSpam(groups.isSpam),
      },
});

const resolveIsHuman = (
  sources: CredentialRecordRaw[],
): CredentialRecordRaw[] => {
  return sources.filter((x) => x.value === "true");
};

const resolveIsRisky = (
  sources: CredentialRecordRaw[],
): CredentialRecordRaw[] => {
  return sources;
};

const resolveIsSpam = (
  sources: CredentialRecordRaw[],
): CredentialRecordRaw[] => {
  return sources.filter((x) => x.type === "score" && Number(x.value) === 0);
};
