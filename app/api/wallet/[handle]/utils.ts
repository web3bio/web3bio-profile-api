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

type WalletIdentity = {
  identity: string | null;
  address: string | null;
  platform: Platform;
  isPrimary: boolean;
  displayName: string | null;
  avatar: string | null;
  description: string | null;
  updatedAt: string | number | null;
  domains: WalletIdentity[];
  sources?: string[];
};

const getIdentityKey = (record: Pick<IdentityRecord, "platform" | "identity">) =>
  `${record.platform},${record.identity}`;

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

const resolveAvatar = async (
  avatarUrl: string | null | undefined,
): Promise<string | null> => {
  if (!avatarUrl) return null;
  return resolveEipAssetURL(avatarUrl).catch(() => avatarUrl);
};

const toDomainIdentity = async (record: IdentityRecord): Promise<WalletIdentity> => ({
  identity: record.identity || null,
  address: record.profile?.address || null,
  platform: record.platform,
  isPrimary: record.isPrimary || false,
  displayName: record.profile?.displayName || null,
  avatar: await resolveAvatar(record.profile?.avatar),
  description: record.profile?.description || null,
  updatedAt: record.updatedAt || null,
  domains: [],
});

const hasOwnerAddress = (
  domainRecord: IdentityRecord,
  address: string | undefined,
): boolean => {
  if (!address) return false;
  return (
    domainRecord.ownerAddress?.some((owner) =>
      isSameAddress(owner.address, address),
    ) || false
  );
};

const buildDomainsMap = (
  vertices: IdentityRecord[],
): Map<string, IdentityRecord[]> => {
  const networkVertices = vertices.filter(({ platform }) =>
    NETWORK_PLATFORM_SET.has(platform),
  );
  const domainVertices = vertices
    .filter(({ platform }) => NS_PLATFORM_SET.has(platform))
    .sort((a, b) => Number(b.isPrimary) - Number(a.isPrimary));

  const domainsMap = new Map<string, IdentityRecord[]>();
  for (const networkVertex of networkVertices) {
    const domains = domainVertices.filter((domainVertex) =>
      hasOwnerAddress(domainVertex, networkVertex.profile?.address),
    );
    domainsMap.set(getIdentityKey(networkVertex), domains);
  }

  return domainsMap;
};

const formatWalletIdentity = async (
  record: IdentityRecord,
  domainsMap: Map<string, IdentityRecord[]>,
  sourcesMap: Map<string, string[]>,
  includeSources: boolean,
): Promise<WalletIdentity> => {
  const domains = NETWORK_PLATFORM_SET.has(record.platform)
    ? await Promise.all(
        (domainsMap.get(getIdentityKey(record)) || []).map(toDomainIdentity),
      )
    : [];

  const result: WalletIdentity = {
    identity: record.identity || null,
    address: record.profile?.address || null,
    platform: record.platform,
    isPrimary: record.isPrimary || false,
    displayName: record.profile?.displayName || null,
    avatar: await resolveAvatar(record.profile?.avatar),
    description: record.profile?.description || null,
    updatedAt: record.updatedAt || null,
    domains,
  };

  if (includeSources) {
    result.sources = sourcesMap.get(getIdentityKey(record)) || [];
  }

  return result;
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
  const domainsMap = buildDomainsMap(vertices);
  const [main, graph] = await Promise.all([
    formatWalletIdentity(root, domainsMap, sourcesMap, false),
    Promise.all(
      vertices
        .filter(
          (v) =>
            !NS_PLATFORM_SET.has(v.platform) &&
            v.identity !== root.identity,
        )
        .map((v) => formatWalletIdentity(v, domainsMap, sourcesMap, true)),
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
