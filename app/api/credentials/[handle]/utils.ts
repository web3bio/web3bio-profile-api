import { respondWithCache } from "@/utils/base";
import { PlatformType } from "@/utils/platform";
import { QueryType, queryIdentityGraph } from "@/utils/query";
import {
  AuthHeaders,
  CredentialRecord,
  CredentialsResponse,
  CredentialCategory,
  CredentialRecordRaw,
} from "@/utils/types";

export const resolveCredentialsHandle = async (
  identity: string,
  platform: PlatformType,
  headers: AuthHeaders,
) => {
  const res = await queryIdentityGraph(
    QueryType.GET_CREDENTIALS_QUERY,
    identity,
    platform,
    headers,
  );
  const credentials = res?.data?.identity?.identityGraph?.vertices?.filter(
    (x: CredentialRecord) => x.credentials,
  );
  const json = credentials?.length ? resolveCredentialsStruct(credentials) : [];

  return respondWithCache(JSON.stringify(json));
};

const calculateCategoryValue = (
  category: CredentialCategory,
  sources: CredentialRecordRaw[],
): boolean => {
  switch (category) {
    case "isHuman":
      if (
        sources.some(
          (x) =>
            ["binance", "coinbase"].includes(x.dataSource) &&
            x.value === "true",
        )
      )
        return true;

      return sources.length > 0;

    case "isRisky":
      return sources.length > 0;

    case "isSpam":
      if (
        sources.find(
          (x) =>
            x.dataSource === "warpcast" &&
            x.type === "score" &&
            Number(x.value) === 0,
        )
      )
        return true;

    default:
      return false;
  }
};

const calculateValue = (data: CredentialsResponse[]): CredentialsResponse[] => {
  for (let i = 0; i < data.length; i++) {
    const credentials = data[i].credentials;
    const keys = Object.keys(credentials);

    for (let j = 0; j < keys.length; j++) {
      const category = keys[j] as CredentialCategory;
      const item = credentials[category];

      if (item) {
        item.value = calculateCategoryValue(category, item.sources);
      }
    }
  }

  return data;
};

const resolveCredentialsStruct = (
  data: CredentialRecord[],
): CredentialsResponse[] => {
  const res = data.map((record) => ({
    id: record.id,
    credentials: record.credentials.reduce(
      (result, credential) => {
        const { category, ...sourceData } = credential;
        if (category) {
          if (!result[category]) {
            result[category] = {
              // init value
              value: false,
              sources: [sourceData],
            };
          } else {
            result[category]?.sources.push(sourceData);
          }
        }
        return result;
      },
      {
        isHuman: null,
        isRisky: null,
        isSpam: null,
      } as Record<
        CredentialCategory,
        { value: boolean; sources: CredentialRecordRaw[] } | null
      >,
    ),
  }));

  return calculateValue(res);
};
