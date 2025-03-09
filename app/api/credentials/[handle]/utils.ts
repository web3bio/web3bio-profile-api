import { respondWithCache } from "@/utils/base";
import { PlatformType } from "@/utils/platform";
import { QueryType, queryIdentityGraph } from "@/utils/query";
import {
  AuthHeaders,
  CredentialRecord,
  CredentialsResponse,
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
  const json = !credentials?.length
    ? []
    : resolveCredentialsStruct(credentials);

  return respondWithCache(JSON.stringify(json));
};

const resolveCredentialsStruct = (data: CredentialRecord[]) => {
  const result: CredentialsResponse[] = [];
  data.forEach((x) => {
    result.push({
      id: x.id,
      credentials: x.credentials.reduce(
        (pre, cur) => {
          const { category, ...rest } = cur;
          if (!pre[category]) {
            pre[category] = {
              value: true,
              sources: [{ ...rest }],
            };
          } else {
            pre[category].sources.push({ ...rest });
          }

          return pre;
        },
        {
          isHuman: null,
          isRisky: null,
          isSpam: null,
        } as any,
      ),
    });
  });

  return result;
};
