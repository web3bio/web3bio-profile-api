import {
  CredentialData,
  CredentialResponse,
  CredentialSource,
  ErrorMessages,
  Platform,
} from "web3bio-profile-kit/types";
import { QueryType, queryIdentityGraph } from "@/utils/query";
import type { AuthHeaders } from "@/utils/types";
import { errorHandle, respondWithCache } from "@/utils/utils";
import { CREDENTIALS_INFO } from "@/utils/credentials";

interface CredentialVertice {
  id: string;
  credentials: CredentialData[];
}

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

    const vertices = res?.data?.identity?.identityGraph
      ?.vertices as CredentialVertice[];

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
        v.credentials?.map((x) => ({
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
  credentials: CredentialData[],
): CredentialResponse => {
  const groups: CredentialResponse = {
    isHuman: [],
    isRisky: [],
    isSpam: [],
  };

  const categoryChecks = {
    isHuman: checkIsHuman,
    isRisky: checkIsRisky,
    isSpam: checkIsSpam,
  };

  for (const credential of credentials) {
    const category = credential.category as keyof typeof categoryChecks;

    if (
      category &&
      groups[category] &&
      categoryChecks[category]?.(credential)
    ) {
      const metadata = CREDENTIALS_INFO[credential.dataSource];
      groups[category]?.push({
        id: credential.id,
        category: credential.category,
        dataSource: credential.dataSource,
        description: metadata?.description || "",
        expiredAt: credential.expiredAt,
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

const checkIsHuman = (item: CredentialData): boolean => {
  return (
    item.value === "true" ||
    (item.dataSource === "human-passport" && Number(item.value) >= 20)
  );
};

const checkIsRisky = (item: CredentialData): boolean => {
  return Boolean(CREDENTIALS_INFO[item.value as CredentialSource]);
};

const checkIsSpam = (item: CredentialData): boolean => {
  return (
    item.dataSource === "warpcast" &&
    item.type === "score" &&
    Number(item.value) === 0
  );
};
