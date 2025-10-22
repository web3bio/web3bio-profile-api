import {
  CredentialsData,
  CredentialsResponse,
  ErrorMessages,
  Platform,
} from "web3bio-profile-kit/types";
import { QueryType, queryIdentityGraph } from "@/utils/query";
import type { AuthHeaders } from "@/utils/types";
import { errorHandle, respondWithCache } from "@/utils/utils";
import { CREDENTIALS_INFO } from "@/utils/credentials";

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

    const vertices = res?.data?.identity?.identityGraph?.vertices as any[];

    if (!vertices?.length) {
      return errorHandle({
        identity,
        code: 404,
        path: pathname,
        platform,
        message: ErrorMessages.NOT_FOUND,
      });
    }
    const credentials = vertices.flatMap(
      (v) =>
        v.credentials?.map((x: any) => ({
          ...x,
          id: v.id,
        })) || [],
    );
    return respondWithCache(processCredentials(credentials));
  } catch (error) {
    return errorHandle({
      identity,
      code: 500,
      path: pathname,
      platform,
      message: ErrorMessages.NETWORK_ERROR,
    });
  }
};

const processCredentials = (
  credentials: CredentialsData[],
): CredentialsResponse => {
  const groups: any = {
    isHuman: [],
    isRisky: [],
    isSpam: [],
  };

  for (const credential of credentials) {
    if (credential.category && groups[credential.category]) {
      const metadata = CREDENTIALS_INFO[credential.dataSource];
      groups[credential.category].push({
        id: credential.id,
        category: credential.category,
        dataSource: credential.dataSource,
        description: metadata?.description || "",
        expiredAt: (credential as any).expiredAt,
        icon: metadata?.icon || "",
        label: metadata?.label || "",
        link: credential.link,
        platform: metadata?.platform,
        type: credential.type,
        updatedAt: credential.updatedAt,
        value: credential.value,
      });
    }
  }
  return groups;
};
