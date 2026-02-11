import {
  type CredentialType,
  type CredentialResponse,
  CredentialSource,
  ErrorMessages,
  Platform,
} from "web3bio-profile-kit/types";
import { QueryType, queryIdentityGraph } from "@/utils/query";
import type {
  AuthHeaders,
  CredentialRecord,
  CredentialVertice,
} from "@/utils/types";
import { errorHandle, respondJson } from "@/utils/utils";
import { CREDENTIAL_INFO } from "@/utils/credential";
import { isSameAddress } from "web3bio-profile-kit/utils";

type CredentialCategory = keyof CredentialResponse;

export const evaluateCategory = (
  category: CredentialCategory,
  item: CredentialRecord,
): boolean => {
  switch (category) {
    case "isHuman":
      return (
        item.value === "true" ||
        (item.dataSource === CredentialSource.humanPassport &&
          Number(item.value) >= 20)
      );
    case "isRisky":
      return (
        !!CREDENTIAL_INFO[item.dataSource as CredentialSource] &&
        item.value === "true"
      );
    case "isSpam":
      return (
        item.dataSource === CredentialSource.farcasterSpam &&
        item.type === "score" &&
        Number(item.value) === 0
      );
    default:
      return false;
  }
};

export const processCredentials = (
  credentials: CredentialRecord[],
): CredentialResponse => {
  return credentials.reduce(
    (groups, credential) => {
      const category = credential.category as CredentialCategory;

      if (!category || !groups[category]) {
        return groups;
      }

      if (!evaluateCategory(category, credential)) {
        return groups;
      }

      const source = credential.dataSource as CredentialSource | undefined;
      const metadata = source ? CREDENTIAL_INFO[source] : undefined;
      const {
        label = "",
        description = "",
        platform: metadataPlatform,
      } = metadata ?? {};

      groups[category].push({
        id: credential.id,
        platform: metadataPlatform ?? credential.platform,
        category: credential.category,
        credentialSource: credential.dataSource as CredentialSource,
        type: credential.type,
        value: credential.value,
        label,
        description,
        link: credential.link,
        updatedAt: credential.updatedAt,
        expiredAt: credential.expiredAt,
      });

      return groups;
    },
    {
      isHuman: [],
      isRisky: [],
      isSpam: [],
    } as CredentialResponse,
  );
};

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
    const rawVertices = res.data?.identity?.identityGraph?.vertices;

    if (!rawVertices) {
      return errorHandle({
        identity,
        code: 404,
        path: pathname,
        platform,
        message: ErrorMessages.NOT_FOUND,
      });
    }

    const vertices = rawVertices.filter((vertex: CredentialVertice) => {
      if (vertex.id === queryId) return true;
      if (!address) return false;

      const [, vertexIdentity] = vertex.id?.split(",") ?? [];
      return vertexIdentity ? isSameAddress(address, vertexIdentity) : false;
    });

    if (!vertices.length) {
      return errorHandle({
        identity,
        code: 404,
        path: pathname,
        platform,
        message: ErrorMessages.NOT_FOUND,
      });
    }

    const credentials = vertices.flatMap(
      ({
        id: vertexId,
        platform: vertexPlatform,
        credentials: vertexCredentials,
      }: CredentialVertice) =>
        vertexCredentials?.map((credential: CredentialType) => ({
          ...credential,
          id: vertexId,
          platform: vertexPlatform,
        })) || [],
    );

    return respondJson(processCredentials(credentials as CredentialRecord[]));
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
