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
  CredentialVertex,
} from "@/utils/types";
import { errorHandle, respondJson } from "@/utils/utils";
import { CREDENTIAL_INFO } from "@/utils/credential";
import { isSameAddress } from "web3bio-profile-kit/utils";

type CredentialCategory = keyof CredentialResponse;
const createCredentialGroups = (): CredentialResponse => ({
  isHuman: [],
  isRisky: [],
  isSpam: [],
});

const isCredentialCategory = (
  category: string | undefined,
): category is CredentialCategory =>
  category === "isHuman" || category === "isRisky" || category === "isSpam";

const buildErrorResponse = (
  identity: string,
  platform: Platform,
  pathname: string,
  code: 404 | 500,
) =>
  errorHandle({
    identity,
    code,
    path: pathname,
    platform,
    message:
      code === 404 ? ErrorMessages.NOT_FOUND : ErrorMessages.NETWORK_ERROR,
  });

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
      const { category } = credential;
      if (!isCredentialCategory(category)) {
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
      const group = groups[category];
      if (!group) {
        return groups;
      }

      group.push({
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
    createCredentialGroups(),
  );
};

const filterRelatedVertices = (
  vertices: CredentialVertex[],
  queryId: string,
  address: string,
): CredentialVertex[] =>
  vertices.filter((vertex) => {
    if (vertex.id === queryId) return true;
    if (!address) return false;

    const [, vertexIdentity] = vertex.id?.split(",") ?? [];
    return vertexIdentity ? isSameAddress(address, vertexIdentity) : false;
  });

const flattenVertexCredentials = (
  vertices: CredentialVertex[],
): CredentialRecord[] =>
  vertices.flatMap(({ id, platform, credentials }) => {
    const normalized = (credentials || []).map((credential: CredentialType) => ({
      ...credential,
      id,
      platform,
    }));
    return normalized as unknown as CredentialRecord[];
  });

export const resolveCredentialHandle = async (
  identity: string,
  platform: Platform,
  headers: AuthHeaders,
  pathname: string,
) => {
  const notFoundResponse = () =>
    buildErrorResponse(identity, platform, pathname, 404);

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
      return notFoundResponse();
    }

    const vertices = filterRelatedVertices(rawVertices, queryId, address);

    if (!vertices.length) {
      return notFoundResponse();
    }

    const credentials = flattenVertexCredentials(vertices);
    return respondJson(processCredentials(credentials));
  } catch {
    return buildErrorResponse(identity, platform, pathname, 500);
  }
};
