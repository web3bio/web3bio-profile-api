import { Platform } from "web3bio-profile-kit/types";
import { detectPlatform } from "web3bio-profile-kit/utils";
import { getErrorCauseCode, IDENTITY_GRAPH_SERVER, normalizeText } from "./utils";
import type { AuthHeaders, IdentityRecord } from "./types";
import { generateProfileStruct, resolveIdentityBatch } from "./base";
import { resolveWithIdentityGraph } from "@/app/api/profile/[handle]/utils";

export enum QueryType {
  GET_CREDENTIALS_QUERY = "GET_CREDENTIALS_QUERY",
  GET_BADGES_QUERY = "GET_BADGES_QUERY",
  GET_PROFILES_NS = "GET_PROFILES_NS",
  GET_PROFILES = "GET_PROFILES",
  GET_DOMAIN = "GET_DOMAIN",
  GET_BATCH = "GET_BATCH",
  GET_BATCH_UNIVERSAL = "GET_BATCH_UNIVERSAL",
  GET_AVAILABLE_DOMAINS = "GET_AVAILABLE_DOMAINS",
  GET_SEARCH_SUGGEST = "GET_SEARCH_SUGGEST",
  GET_SEARCH_QUERY = "GET_SEARCH_QUERY",
  GET_SOCIAL_GRAPH = "GET_SOCIAL_GRAPH",
  GET_ASSOCIATED_ACCOUNTS = "GET_ASSOCIATED_ACCOUNTS",
  GET_FOLLOWING_ASSOCIATED_ACCOUNTS = "GET_FOLLOWING_ASSOCIATED_ACCOUNTS",
  GET_WALLET_QUERY = "GET_WALLET_QUERY",
  REFRESH_DOMAIN = "REFRESH_DOMAIN",
}

const GET_WALLET_QUERY = `
  query GET_WALLET_QUERY($platform: Platform!, $identity: String!) {
    identity(platform: $platform, identity: $identity) {
      identity
      platform
      isPrimary
      updatedAt
      credentials {
        category
        type
        value
        dataSource
        link
        updatedAt
        expiredAt
      }
      profile {
        address
        identity
        platform
        displayName
        avatar
        description
      }
      identityGraph {
        vertices {
          identity
          platform
          updatedAt
          isPrimary
          ownerAddress {
            address
            network
          }
          profile {
            address
            identity
            displayName
            avatar
            description
          }
        }
        edges {
          target
          dataSource
        }
      }
    }
  }
`;

const GET_CREDENTIALS_QUERY = `
  query GET_CREDENTIALS_QUERY($platform: Platform!, $identity: String!) {
    identity(platform: $platform, identity: $identity) {
      profile {
        address
      }
      identityGraph {
        vertices {
          id
          platform
          credentials {
            category
            type
            value
            dataSource
            link
            updatedAt
            expiredAt
          }
        }
      }
    }
  }
`;

const BADGE_FIELDS = `
  badgeId
  badgeName
  badgeCategory
  network
  address
  claimTxhash
  dataSource
  issuedAt
  updatedAt
`;

const GET_BADGES_QUERY = `
  query GET_BADGES_QUERY($platform: Platform!, $identity: String!) {
    identity(platform: $platform, identity: $identity) {
      profile {
        address
      }
      badges {${BADGE_FIELDS}}
      identityGraph {
        vertices {
          id
          platform
          badges {${BADGE_FIELDS}}
        }
      }
    }
  }
`;

const GET_PROFILES_NS = `
  query GET_PROFILES_NS($platform: Platform!, $identity: String!) {
    identity(platform: $platform, identity: $identity) {
      identity
      platform
      isPrimary
      registeredAt
      resolvedAddress {
        network
        address
      }
      ownerAddress {
        network
        address
      }
      profile {
        identity
        platform
        address
        displayName
        avatar
        description
        texts
        addresses {
          address
          network
          isPrimary
        }
      }
      identityGraph {
        vertices {
          identity
          platform
          isPrimary
          registeredAt
          resolvedAddress {
            network
            address
          }
          ownerAddress {
            network
            address
          }
          profile {
            identity
            platform
            address
            texts
            addresses {
              address
              network
              isPrimary
            }
            displayName
            avatar
            description
          }
        }
      }
    }
  }
`;

const GET_PROFILES = `
  query GET_PROFILES($platform: Platform!, $identity: String!) {
    identity(platform: $platform, identity: $identity) {
      aliases
      identity
      platform
      isPrimary
      expiredAt
      registeredAt
      resolvedAddress {
        network
        address
      }
      ownerAddress {
        network
        address
      }
      profile {
        uid
        identity
        platform
        address
        displayName
        avatar
        description
        contenthash
        texts
        addresses {
          address
          network
          isPrimary
        }
        social {
          uid
          follower
          following
        }
      }
      identityGraph {
        vertices {
          aliases
          identity
          platform
          isPrimary
          expiredAt
          registeredAt
          resolvedAddress {
            network
            address
          }
          ownerAddress {
            network
            address
          }
          profile {
            uid
            identity
            platform
            address
            displayName
            avatar
            description
            contenthash
            texts
            addresses {
              address
              network
              isPrimary
            }
            social {
              uid
              follower
              following
            }
          }
        }
        edges {
          source
          target
          dataSource
          edgeType
        }
      }
    }
  }
`;

const GET_BATCH = `
  query GET_BATCH($ids: [String!]!) {
    identities(ids: $ids) {
      aliases
      registeredAt
      profile {
        address
        avatar
        contenthash
        description
        displayName
        identity
        network
        platform
        texts
        uid
        addresses {
          address
          network
          isPrimary
        }
        social {
          follower
          following
          uid
          updatedAt
        }
      }
    }
  }
`;

const GET_BATCH_UNIVERSAL = `
  query GET_BATCH_UNIVERSAL($ids: [String!]!) {
    identitiesWithGraph(ids: $ids) {
      identity
      platform
      isPrimary
      resolvedAddress {
        network
        address
      }
      ownerAddress {
        network
        address
      }
      profile {
        uid
        address
        avatar
        displayName
        description
        identity
        platform
        addresses {
          address
          network
          isPrimary
        }
      }
      identityGraph {
        vertices {
          identity
          isPrimary
          platform
          resolvedAddress {
            network
            address
          }
          ownerAddress {
            network
            address
          }
          profile {
            uid
            address
            avatar
            displayName
            description
            identity
            platform
            addresses {
              address
              network
              isPrimary
            }
          }
        }
      }
    }
  }
`;

const GET_DOMAIN = `
  query GET_DOMAIN($platform: Platform!, $identity: String!) {
    identity(platform: $platform, identity: $identity) {
      platform
      identity
      registeredAt
      updatedAt
      expiredAt
      status
      isPrimary
      resolver
      identityGraph {
        vertices {
          platform
          identity
          registeredAt
          updatedAt
          expiredAt
          status
          isPrimary
          resolver
          profile {
            contenthash
          }
          managerAddress {
            network
            address
          }
          resolvedAddress {
            network
            address
          }
          ownerAddress {
            network
            address
          }
        }
      }
      managerAddress {
        network
        address
      }
      resolvedAddress {
        network
        address
      }
      ownerAddress {
        network
        address
      }
      profile {
        uid
        identity
        platform
        address
        contenthash
        texts
        addresses {
          address
          network
          isPrimary
        }
      }
    }
  }
`;

// Domains Availability
export const GET_AVAILABLE_DOMAINS = `
  query GET_AVAILABLE_DOMAINS($name: String!) {
    domainAvailableSearch(name: $name) {
      platform
      name
      expiredAt
      availability
      status
    }
  }
`;
// Seach Suggest
export const GET_SEARCH_SUGGEST = `
  query QUERY_SEARCH_SUGGEST($name: String!) {
    nameSuggest(name: $name) {
      platform
      name
    }
  }
`;
// Search Query
const GET_SEARCH_QUERY = `
 query GET_GRAPH_QUERY($platform: Platform!, $identity: String!) {
    identity(platform: $platform, identity: $identity) {
      identity
      platform
      isPrimary
      expiredAt
      registeredAt
      resolvedAddress {
        network
        address
      }
      ownerAddress {
        network
        address
      }
      provider
      profile {
        identity
        platform
        address
        displayName
        avatar
        description
        social {
          uid
        }
      }
      identityGraph {
        vertices {
          identity
          platform
          isPrimary
          expiredAt
          registeredAt
          provider
          resolvedAddress {
            network
            address
          }
          ownerAddress {
            network
            address
          }
          profile {
            identity
            platform
            address
            displayName
            avatar
            description
            social {
              uid
            }
          }
        }
        edges {
          source
          target
          dataSource
          edgeType
        }
      }
    }
  }
`;

const GET_SOCIAL_GRAPH = `
  query QUERY_SOCIAL(
    $sourceId: String!
    $recommendPlatform: Platform!
    $page: Union!
    $totalPage: Union!
  ) {
    socialGraphCrossPlatformRecommendation(
      sourceId: $sourceId
      recommendPlatform: $recommendPlatform
      page: $page
      totalPage: $totalPage
    ) {
      pagination {
        total
        hasMore
        page
        limit: totalPage
      }
      source {
        id
        platform
        identity
        address
        displayName
        avatar
        description
      }
      vertices {
        id
        platform
        identity
        address
        displayName
        avatar
        description
      }
      edges {
        source
        target
        edgeType
        dataSource
        recommendReason
        updatedAt
      }
    }
  }
`;

const GET_ASSOCIATED_ACCOUNTS = `
  query GET_ASSOCIATED_ACCOUNTS($queryIds: [String!]!) {
    batchAssociatedAccountsLookup(queryIds: $queryIds) {
      queryId
      profile {
        id
        uid
        identity
        platform
        network
        address
        avatar
        description
      }
      associatedAccounts {
        id
        uid
        identity
        platform
        network
        address
        avatar
        description
      }
    }
  }
`;

const GET_FOLLOWING_ASSOCIATED_ACCOUNTS = `
  query GET_FOLLOWING_ASSOCIATED_ACCOUNTS(
    $sourcePlatform: Platform!
    $sourceIdentity: String!
    $targetPlatform: Platform!
    $page: Union!
    $totalPage: Union!
  ) {
    searchFollowingAssociatedAccounts(
      sourcePlatform: $sourcePlatform
      sourceIdentity: $sourceIdentity
      targetPlatform: $targetPlatform
      page: $page
      totalPage: $totalPage
    ) {
      pagination {
        total
        hasMore
        page
        limit: totalPage
      }
      queryId
      profile { ...FollowingProfile }
      following {
        queryId
        profile { ...FollowingProfile }
        associatedAccounts { ...FollowingProfile }
      }
    }
  }

  fragment FollowingProfile on IdentityProfileSimplified {
    id
    uid
    identity
    platform
    network
    address
    avatar
    description
  }
`;

const REFRESH_DOMAIN = `
  query REFRESH_DOMAIN($platform: Platform!, $identity: String!) {
    domainRefresh(platform: $platform, identity: $identity) {
      id
      status
    }
  }
`;

const QUERY_MAP = new Map<QueryType, string>([
  [QueryType.GET_CREDENTIALS_QUERY, GET_CREDENTIALS_QUERY],
  [QueryType.GET_BADGES_QUERY, GET_BADGES_QUERY],
  [QueryType.GET_PROFILES_NS, GET_PROFILES_NS],
  [QueryType.GET_PROFILES, GET_PROFILES],
  [QueryType.GET_DOMAIN, GET_DOMAIN],
  [QueryType.GET_BATCH, GET_BATCH],
  [QueryType.GET_BATCH_UNIVERSAL, GET_BATCH_UNIVERSAL],
  [QueryType.GET_AVAILABLE_DOMAINS, GET_AVAILABLE_DOMAINS],
  [QueryType.GET_SEARCH_SUGGEST, GET_SEARCH_SUGGEST],
  [QueryType.GET_SEARCH_QUERY, GET_SEARCH_QUERY],
  [QueryType.GET_SOCIAL_GRAPH, GET_SOCIAL_GRAPH],
  [QueryType.GET_ASSOCIATED_ACCOUNTS, GET_ASSOCIATED_ACCOUNTS],
  [QueryType.GET_FOLLOWING_ASSOCIATED_ACCOUNTS, GET_FOLLOWING_ASSOCIATED_ACCOUNTS],
  [QueryType.GET_WALLET_QUERY, GET_WALLET_QUERY],
  [QueryType.REFRESH_DOMAIN, REFRESH_DOMAIN],
]);

export function getQuery(type: QueryType): string {
  const query = QUERY_MAP.get(type);
  if (!query) {
    throw new Error(`Unknown query type: ${type}`);
  }
  return query;
}

export async function postIdentityGraphQuery<T = Record<string, unknown>>(
  headers: AuthHeaders,
  query: string,
  variables: Record<string, unknown>,
  allowPartial = false,
): Promise<{ data: T; errors?: unknown }> {
  const signal = AbortSignal.timeout(30_000);
  const response = await fetch(IDENTITY_GRAPH_SERVER, {
    method: "POST",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables }),
    signal,
  });
  let result: { data?: Record<string, unknown>; msg?: string; errors?: unknown; code?: number } | null = null;
  try {
    result = await response.json();
  } catch {
    signal.throwIfAborted();
  }

  const code = result?.code;
  const hasErrorCode = typeof code === "number" && Number.isInteger(code) && code >= 400 && code <= 599;
  if (!response.ok || result?.msg || hasErrorCode || (result?.errors && !(allowPartial && result.data))) {
    const status = !response.ok ? response.status : hasErrorCode ? code : 500;
    const errors = result?.errors;
    const message = result?.msg || (typeof errors === "string" ? errors : JSON.stringify(errors));
    throw new Error(message || `HTTP ${status}: ${response.statusText}`, { cause: status });
  }
  if (!result?.data || typeof result.data !== "object" || Array.isArray(result.data)) {
    throw new Error("Invalid Identity Graph response", { cause: 502 });
  }
  return result as { data: T; errors?: unknown };
}

export async function queryIdentityGraph(
  query: QueryType,
  handle: string,
  platform: Platform = detectPlatform(handle)!,
  headers: AuthHeaders,
) {
  if (!platform) {
    return { errors: `Unable to detect platform for handle: ${handle}` };
  }
  try {
    const { data } = await postIdentityGraphQuery(headers, getQuery(query), { identity: handle, platform });
    const result = data[query === QueryType.REFRESH_DOMAIN ? "domainRefresh" : "identity"];
    if (result === undefined || (result !== null && (typeof result !== "object" || Array.isArray(result)))) {
      throw new Error("Invalid Identity Graph response");
    }
    return { data } as any;
  } catch (error) {
    const code = getErrorCauseCode(error);
    return {
      errors: code === 504 ? "Identity Graph request timed out"
        : error instanceof Error ? error.message : "Identity Graph request failed",
      code,
    };
  }
}

export type BatchMode = "profile" | "ns" | "universal";

export async function queryIdentityGraphBatch(ids: string[], mode: BatchMode, headers: AuthHeaders) {
  const queryIds = resolveIdentityBatch(ids);
  if (!queryIds.length) return [];
  const universal = mode === "universal";
  const query = getQuery(universal ? QueryType.GET_BATCH_UNIVERSAL : QueryType.GET_BATCH);
  const { data, errors } = await postIdentityGraphQuery(headers, query, { ids: queryIds }, true);
  const identities = data[universal ? "identitiesWithGraph" : "identities"];
  if (!Array.isArray(identities)) throw new Error("Invalid Identity Graph response");

  const results = universal
    ? await resolveBatchGraphs(queryIds, identities)
    : await resolveBatchProfiles(queryIds, identities, mode === "ns");
  if (errors && !results.length) throw new Error("Batch lookup failed", { cause: 500 });
  return results;
}

async function resolveBatchGraphs(queryIds: string[], identities: IdentityRecord[]) {
  const identityMap = new Map(
    identities
      .filter((x) => !!x)
      .map((identity) => [
        `${identity.platform},${identity.identity}`,
        identity,
      ]),
  );

  const results = await Promise.all(queryIds.map(async (id) => {
    const identity = identityMap.get(id);
    if (!identity) return null;
    const profiles = await resolveWithIdentityGraph({
      handle: identity.identity,
      platform: identity.platform,
      ns: true,
      response: { data: { identity } },
    }).catch(() => null);
    return Array.isArray(profiles) && profiles.length ? { id, profiles } : null;
  }));
  return results.filter(result => result !== null);
}

async function resolveBatchProfiles(queryIds: string[], identities: IdentityRecord[], ns: boolean) {
  const processedResults = await Promise.allSettled(
    identities.map(async ({ profile, registeredAt, aliases }) => ({
      ...await generateProfileStruct({ ...profile, createdAt: registeredAt }, ns),
      aliases,
    })),
  );
  const validResults = processedResults.flatMap(result =>
    result.status === "fulfilled" ? [result.value] : []
  );

  const queryIdSet = new Set(queryIds);
  const normalizedResultMap = new Map(
    validResults.map((result) => [
      `${result.platform},${normalizeText(result.identity)}`,
      result,
    ]),
  );
  const resultMap = new Map(
    validResults.map((result) => [
      result.aliases?.find((alias: string) => queryIdSet.has(alias)) ||
        `${result.platform},${normalizeText(result.identity)}`,
      result,
    ]),
  );

  return queryIds
    .map((queryId) => {
      const directMatch = resultMap.get(queryId);
      if (directMatch) {
        return directMatch;
      }
      const [platform, identity] = queryId.split(",");
      return (
        normalizedResultMap.get(`${platform},${normalizeText(identity)}`) ||
        null
      );
    })
    .filter(Boolean);
}

export const REFRESH_DOMAIN_PLATFORMS: readonly Platform[] = [
  Platform.ens,
  Platform.basenames,
  Platform.linea,
];

export const refreshDomain = async (
  platform: Platform,
  identity: string,
  headers: AuthHeaders,
): Promise<{ status: unknown } | null> => {
  if (!REFRESH_DOMAIN_PLATFORMS.includes(platform)) {
    return null;
  }
  const body = await queryIdentityGraph(
    QueryType.REFRESH_DOMAIN,
    identity,
    platform,
    headers,
  );
  if (body?.errors) {
    throw new Error(body.errors, { cause: body.code });
  }
  const status = (
    body as { data?: { domainRefresh?: { status?: unknown } } }
  ).data?.domainRefresh?.status;
  return { status };
};
