import { prettify, respondWithCache } from "@/utils/base";
import { PlatformType } from "@/utils/platform";
import { GET_CREDENTIALS_QUERY, queryIdentityGraph } from "@/utils/query";
import {
  AuthHeaders,
  CredentialRecord,
  CredentialsResponse,
} from "@/utils/types";

const emptyReturn = {
  isHuman: null,
  isRisky: null,
  isSpam: null,
};

export const resolveCredentialsHandle = async (
  identity: string,
  platform: PlatformType,
  headers: AuthHeaders
) => {
  const handleToQuery = prettify(identity);
  const res = await queryIdentityGraph(
    handleToQuery,
    platform,
    GET_CREDENTIALS_QUERY,
    headers
  );
  const credentials = res?.data?.identity?.credentials;

  const json = !credentials?.length
    ? emptyReturn
    : resolveCredentialsStruct(credentials);

  return respondWithCache(JSON.stringify(json));
};

const resolveCredentialsStruct = (data: CredentialRecord[]) => {
  return data.reduce((pre: CredentialsResponse, cur: CredentialRecord) => {
    const { category, ...rest } = cur;
    if (!pre[category]) {
      pre[category] = { value: false, sources: [] };
    }
    pre[category].sources.push(rest);
    pre[category].value = pre[category].sources.length > 0;
    return pre;
  }, JSON.parse(JSON.stringify(emptyReturn)));
};
