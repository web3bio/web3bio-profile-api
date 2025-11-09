import {
  CredentialType,
  CredentialResponse,
  CredentialSource,
  ErrorMessages,
  Platform,
} from "web3bio-profile-kit/types";
import { QueryType, queryIdentityGraph } from "@/utils/query";
import type { AuthHeaders, CredentialRecord } from "@/utils/types";
import { errorHandle, respondWithCache } from "@/utils/utils";
import { CREDENTIAL_INFO } from "@/utils/credential";
import { isSameAddress } from "web3bio-profile-kit/utils";

interface CredentialVertice {
  id: string;
  platform: Platform;
  credentials: CredentialType[];
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
    const queryId = `${platform},${identity}`;
    const address = res.data?.identity?.profile?.address || "";
    const rawVertices = res?.data?.identity?.identityGraph?.vertices;

    const vertices =
      rawVertices?.filter((x: CredentialVertice) => {
        if (x.id === queryId) return true;
        if (!address) return false;
        const parts = x.id?.split(",");
        const _identity = parts?.[1];
        return _identity ? isSameAddress(address, _identity) : false;
      }) || [];

    if (!vertices.length) {
      return errorHandle({
        identity,
        code: 404,
        path: pathname,
        platform,
        message: ErrorMessages.NOT_FOUND,
      });
    }
    const credentials: CredentialRecord[] = [];
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
  credentials: CredentialRecord[],
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

    const source = credential.dataSource as CredentialSource | undefined;
    const metadata = source ? CREDENTIAL_INFO[source] : undefined;
    const {
      label = "",
      description = "",
      platform: metadataPlatform,
    } = metadata ?? {};

    group.push({
      id: credential.id,
      platform: metadataPlatform ?? credential.platform,
      category: credential.category,
      credentialSource: credential.dataSource as CredentialSource,
      credentialType: credential.type,
      credentialValue: credential.value,
      label,
      description,
      link: credential.link,
      updatedAt: credential.updatedAt,
      expiredAt: credential.expiredAt,
    });
  }
  return groups;
};

const checkIsHuman = (item: CredentialRecord): boolean => {
  return (
    item.value === "true" ||
    (item.dataSource === CredentialSource.humanPassport &&
      Number(item.value) >= 20)
  );
};

const checkIsRisky = (item: CredentialRecord): boolean => {
  return (
    Boolean(CREDENTIAL_INFO[item.dataSource as CredentialSource]) &&
    item.value === "true"
  );
};

const checkIsSpam = (item: CredentialRecord): boolean => {
  return (
    item.dataSource === CredentialSource.farcasterSpam &&
    item.type === "score" &&
    Number(item.value) === 0
  );
};
