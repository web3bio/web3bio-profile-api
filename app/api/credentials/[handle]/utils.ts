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

const resolveCredentialsStruct = (
  data: CredentialRecord[],
): CredentialsResponse[] => {
  return data.map((record) => ({
    id: record.id,
    credentials: record.credentials.reduce(
      (result, credential) => {
        const { category, ...sourceData } = credential;
        if (category) {
          if (!result[category]) {
            result[category] = {
              value: true,
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
};
