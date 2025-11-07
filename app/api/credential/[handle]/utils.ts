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
import { CREDENTIAL_INFO } from "@/utils/credential";

interface CredentialVertice {
  id: string;
  platform: Platform;
  credentials: CredentialData[];
}

type CredentialCategory = keyof CredentialResponse;

export const resolveCredentialHandle = async (
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

    const rawVertices = res?.data?.identity?.identityGraph?.vertices;
    const vertices = Array.isArray(rawVertices)
      ? (rawVertices as CredentialVertice[])
      : [];

    if (!vertices.length) {
      return errorHandle({
        identity,
        code: 404,
        path: pathname,
        platform,
        message: ErrorMessages.NOT_FOUND,
      });
    }
    const credentials: CredentialData[] = [];
    for (const {
      id: vertexId,
      platform: vertexPlatform,
      credentials: vertexCredentials,
    } of vertices) {
      if (!vertexCredentials?.length) {
        continue;
      }

      for (const credential of vertexCredentials) {
        credentials.push({
          ...credential,
          id: vertexId,
          platform: vertexPlatform,
        });
      }
    }
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
    const category = credential.category as CredentialCategory;

    if (!category) {
      continue;
    }

    const group = groups[category];
    const evaluate = categoryChecks[category];

    if (!group || !evaluate?.(credential)) {
      continue;
    }

    const metadata = CREDENTIAL_INFO[credential.dataSource];
    const {
      label = "",
      description = "",
      icon = "",
      platform: metadataPlatform,
    } = metadata ?? {};

    group.push({
      id: credential.id,
      platform: metadataPlatform ?? credential.platform,
      category: credential.category,
      dataSource: credential.dataSource,
      label,
      description,
      icon,
      type: credential.type,
      value: credential.value,
      link: credential.link,
      updatedAt: credential.updatedAt,
      expiredAt: credential.expiredAt,
    });
  }
  return groups;
};

const checkIsHuman = (item: CredentialData): boolean => {
  return (
    item.value === "true" ||
    (item.dataSource === CredentialSource.humanPassport &&
      Number(item.value) >= 20)
  );
};

const checkIsRisky = (item: CredentialData): boolean => {
  return Boolean(CREDENTIAL_INFO[item.dataSource]) && item.value === "true";
};

const checkIsSpam = (item: CredentialData): boolean => {
  return (
    item.dataSource === CredentialSource.farcasterSpam &&
    item.type === "score" &&
    Number(item.value) === 0
  );
};
