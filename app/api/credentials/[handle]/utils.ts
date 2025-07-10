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
      .filter((v) => v.credentials?.length)
      .sort((a, b) => (a.id === targetId ? -1 : b.id === targetId ? 1 : 0));

    if (!credentials.length) {
      return errorHandle({
        identity,
        code: 404,
        path: pathname,
        platform,
        message: ErrorMessages.NOT_FOUND,
      });
    }

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
    credentials: processCredentialGroups(
      groupCredentialsByCategory(record.credentials),
    ),
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
  isHuman: groups.isHuman.length
    ? { value: calculateHumanValue(groups.isHuman), sources: groups.isHuman }
    : null,
  isRisky: groups.isRisky.length
    ? { value: true, sources: groups.isRisky }
    : null,
  isSpam: groups.isSpam.length
    ? { value: calculateSpamValue(groups.isSpam), sources: groups.isSpam }
    : null,
});

const calculateHumanValue = (sources: CredentialRecordRaw[]): boolean =>
  sources.some(
    (s) => ["binance", "coinbase"].includes(s.dataSource) && s.value === "true",
  ) || !!sources.length;

const calculateSpamValue = (sources: CredentialRecordRaw[]): boolean =>
  sources.some(
    (s) =>
      s.dataSource === "warpcast" &&
      s.type === "score" &&
      Number(s.value) === 0,
  );
