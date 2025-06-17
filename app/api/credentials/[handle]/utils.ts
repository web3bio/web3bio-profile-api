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
  const res = await queryIdentityGraph(
    QueryType.GET_CREDENTIALS_QUERY,
    identity,
    platform,
    headers,
  );

  // Early return if no identity data
  if (!res?.data?.identity?.identityGraph?.vertices) {
    return errorHandle({
      identity: identity,
      code: 404,
      path: pathname,
      platform: platform,
      message: ErrorMessages.NOT_FOUND,
    });
  }

  const credentials = (
    res.data.identity.identityGraph.vertices as CredentialRecord[]
  )
    .filter((x) => x.credentials)
    .sort((a, b) => {
      const targetId = `${platform},${identity}`;
      if (a.id === targetId) return -1;
      if (b.id === targetId) return 1;
      return 0;
    });

  if (!credentials.length) {
    return errorHandle({
      identity: identity,
      code: 404,
      path: pathname,
      platform: platform,
      message: ErrorMessages.NOT_FOUND,
    });
  }

  const json = resolveCredentialsStruct(credentials);
  return respondWithCache(JSON.stringify(json));
};

// Simpler and combined function to handle credential processing
const resolveCredentialsStruct = (
  data: CredentialRecord[],
): CredentialsResponse[] => {
  return data.map((record) => {
    const result: Record<
      CredentialCategory,
      { value: boolean; sources: CredentialRecordRaw[] } | null
    > = {
      isHuman: null,
      isRisky: null,
      isSpam: null,
    };

    // Group credentials by category
    for (const credential of record.credentials) {
      const { category, ...sourceData } = credential;
      if (!category) continue;

      if (!result[category]) {
        result[category] = {
          value: false,
          sources: [sourceData],
        };
      } else if (result[category]) {
        result[category].sources.push(sourceData);
      }
    }

    // Calculate values for each category once
    if (result.isHuman) {
      const sources = result.isHuman.sources;
      result.isHuman.value =
        sources.some(
          (x) =>
            ["binance", "coinbase"].includes(x.dataSource) &&
            x.value === "true",
        ) || sources.length > 0;
    }

    if (result.isRisky) {
      result.isRisky.value = result.isRisky.sources.length > 0;
    }

    if (result.isSpam) {
      const sources = result.isSpam.sources;
      result.isSpam.value = sources.some(
        (x) =>
          x.dataSource === "warpcast" &&
          x.type === "score" &&
          Number(x.value) === 0,
      );
    }

    return {
      id: record.id,
      credentials: result,
    };
  });
};
