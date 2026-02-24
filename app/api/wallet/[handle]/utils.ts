import { queryIdentityGraph, QueryType } from "@/utils/query";
import { resolveEipAssetURL } from "@/utils/resolver";
import {
  AuthHeaders,
  IdentityRecord,
  CredentialRecord,
  IdentityGraphEdge,
} from "@/utils/types";
import { errorHandle, respondJson } from "@/utils/utils";
import { ErrorMessages, Platform } from "web3bio-profile-kit/types";
import { isSameAddress } from "web3bio-profile-kit/utils";
import { processCredentials } from "../../credential/[handle]/utils";

const NAME_SERVICE_MAPPING = [
  { network: Platform.ethereum, ns: Platform.ens },
  { network: Platform.ethereum, ns: Platform.basenames },
  { network: Platform.ethereum, ns: Platform.linea },
  { network: Platform.solana, ns: Platform.sns },
];

const format = async (
  v: IdentityRecord,
  all: IdentityRecord[] = [],
  edges: IdentityGraphEdge[] = [],
  isDomainItem: Boolean = false,
): Promise<any> => {
  const avatar = v.profile?.avatar
    ? await resolveEipAssetURL(v.profile.avatar).catch(() => v.profile.avatar)
    : null;

  const domains = NAME_SERVICE_MAPPING.some((x) => x.network === v.platform)
    ? await Promise.all(
        all
          .filter(
            (sv) =>
              NAME_SERVICE_MAPPING.some((m) => m.ns === sv.platform) &&
              sv.ownerAddress?.some((o) =>
                isSameAddress(o.address, v.profile?.address),
              ),
          )
          .sort((a, b) => Number(b.isPrimary) - Number(a.isPrimary))
          .map((sv) => format(sv, [], [], true)),
      )
    : [];

  const res = {
    identity: v.identity || null,
    address: v.profile?.address || null,
    platform: v.platform,
    isPrimary: v.isPrimary || false,
    displayName: v.profile?.displayName || null,
    avatar,
    description: v.profile?.description || null,
    updatedAt: v.updatedAt || null,
    domains,
  };
  if (!isDomainItem) {
    (res as any).sources = resolveSources(`${v.platform},${v.identity}`, edges);
  }
  return res;
};

export const resolveWalletResponse = async (
  handle: string,
  platform: Platform,
  headers: AuthHeaders,
  pathname: string,
) => {
  const res = await queryIdentityGraph(
    QueryType.GET_WALLET_QUERY,
    handle,
    platform,
    headers,
  );
  const root = res?.data?.identity;

  if (!root)
    return errorHandle({
      identity: handle,
      path: pathname,
      platform,
      code: 404,
      message: ErrorMessages.NOT_FOUND,
    });

  const vertices: IdentityRecord[] = root.identityGraph?.vertices || [root];
  const edges: IdentityGraphEdge[] = root.identityGraph?.edges || [];
  const [main, graph] = await Promise.all([
    format(root, vertices, edges),
    Promise.all(
      vertices
        .filter(
          (v) =>
            !NAME_SERVICE_MAPPING.some((m) => m.ns === v.platform) &&
            v.identity !== root.identity,
        )
        .map((v) => format(v, vertices, edges)),
    ),
  ]);

  return respondJson({
    ...main,
    credential: processCredentials(
      (root.credentials || []) as CredentialRecord[],
    ),
    identityGraph: graph,
  });
};

const resolveSources = (id: string, edges: IdentityGraphEdge[]) => {
  if (!edges?.length) return [];

  const sources = new Set<string>();
  edges.forEach((edge) => {
    if (edge.target === id && edge.dataSource) {
      sources.add(edge.dataSource);
    }
  });

  return Array.from(sources);
};
