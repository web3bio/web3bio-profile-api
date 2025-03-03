import { prettify, respondWithCache } from "@/utils/base";
import { PlatformType } from "@/utils/platform";
import { GET_CREDENTIALS_QUERY, queryIdentityGraph } from "@/utils/query";
import {
  AuthHeaders,
  CredentialRecord,
  CredentialsResponse,
} from "@/utils/types";
import { isEqualObject } from "@/utils/utils";
import { NextResponse } from "next/server";

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
  const credentials = res?.data?.identity?.identityGraph?.vertices?.reduce(
    (pre: CredentialRecord[], cur: { credentials: CredentialRecord[] }) => {
      if (cur.credentials) {
        cur.credentials.forEach((i) => {
          pre.push(i);
        });
      }
      return pre;
    },
    []
  );

  if (!credentials) return NextResponse.json(emptyReturn);
  return respondWithCache(
    JSON.stringify(resolveCredentialsStruct(credentials))
  );
};

const resolveCredentialsStruct = (data: CredentialRecord[]) => {
  return data.reduce((pre: CredentialsResponse, cur: CredentialRecord) => {
    const { category, ...rest } = cur;
    if (!pre[category]) {
      pre[category] = { value: false, sources: [] };
    }
    if (!pre[category]?.sources.some((x: any) => isEqualObject(x, rest)))
      pre[category].sources.push(rest);
    pre[category].value = pre[category].sources.length > 0;
    return pre;
  }, JSON.parse(JSON.stringify(emptyReturn)));
};
