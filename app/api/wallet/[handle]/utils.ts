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
const NETWORK_PLATFORM_SET = new Set(
  NAME_SERVICE_MAPPING.map(({ network }) => network),
);
const NS_PLATFORM_SET = new Set(NAME_SERVICE_MAPPING.map(({ ns }) => ns));

const buildSourcesMap = (edges: IdentityGraphEdge[]): Map<string, string[]> => {
  const sourceSets = new Map<string, Set<string>>();
  for (const edge of edges) {
    if (!edge?.target || !edge.dataSource) {
      continue;
    }
    if (!sourceSets.has(edge.target)) {
      sourceSets.set(edge.target, new Set());
    }
    sourceSets.get(edge.target)!.add(edge.dataSource);
  }

  return new Map(
    Array.from(sourceSets.entries()).map(([target, sources]) => [
      target,
      Array.from(sources),
    ]),
  );
};

const format = async (
  v: IdentityRecord,
  all: IdentityRecord[] = [],
  sourcesMap?: Map<string, string[]>,
  isDomainItem: Boolean = false,
): Promise<any> => {
  const avatar = v.profile?.avatar
    ? await resolveEipAssetURL(v.profile.avatar).catch(() => v.profile.avatar)
    : null;

  const domains = NETWORK_PLATFORM_SET.has(v.platform)
    ? await Promise.all(
        all
          .filter(
            (sv) =>
              NS_PLATFORM_SET.has(sv.platform) &&
              sv.ownerAddress?.some((o) =>
                isSameAddress(o.address, v.profile?.address),
              ),
          )
          .sort((a, b) => Number(b.isPrimary) - Number(a.isPrimary))
          .map((sv) => format(sv, [], undefined, true)),
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
    (res as any).sources = sourcesMap?.get(`${v.platform},${v.identity}`) || [];
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
  const sourcesMap = buildSourcesMap(edges);
  const [main, graph] = await Promise.all([
    // root without sources
    format(root, vertices, sourcesMap, true),
    Promise.all(
      vertices
        .filter(
          (v) =>
            !NS_PLATFORM_SET.has(v.platform) &&
            v.identity !== root.identity,
        )
        .map((v) => format(v, vertices, sourcesMap)),
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
