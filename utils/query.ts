import {
  ErrorMessages,
  IdentityString,
  NSResponse,
  Platform,
} from "web3bio-profile-kit/types";
import { detectPlatform } from "web3bio-profile-kit/utils";
import { IDENTITY_GRAPH_SERVER, normalizeText } from "./utils";
import { ProfileRecord, type AuthHeaders } from "./types";
import { generateProfileStruct, resolveIdentityBatch } from "./base";
import { resolveWithIdentityGraph } from "@/app/api/profile/[handle]/utils";

export enum QueryType {
  GET_CREDENTIALS_QUERY = "GET_CREDENTIALS_QUERY",
  GET_PROFILES_NS = "GET_PROFILES_NS",
  GET_PROFILES = "GET_PROFILES",
  GET_REFRESH_PROFILE = "GET_REFRESH_PROFILE",
  GET_DOMAIN = "GET_DOMAIN",
  GET_BATCH = "GET_BATCH",
  GET_BATCH_UNIVERSAL = "GET_BATCH_UNIVERSAL",
  GET_DOMAIN_SINGLE = "GET_DOMAIN_SINGLE",
  GET_AVAILABLE_DOMAINS = "GET_AVAILABLE_DOMAINS",
  GET_SEARCH_SUGGEST = "GET_SEARCH_SUGGEST",
  GET_SEARCH_QUERY = "GET_SEARCH_QUERY",
  GET_WALLET_QUERY = "GET_WALLET_QUERY",
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

const GET_REFRESH_PROFILE = `
  query GET_REFRESH_PROFILE($platform: Platform!, $identity: String!) {
    identity(platform: $platform, identity: $identity, refresh: true) {
      status
      identityGraph {
        graphId
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
const GET_DOMAIN_SINGLE = `
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
  }`;
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
  query GET_SEARCH_PROFILES($platform: Platform!, $identity: String!) {
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

const QUERY_MAP = new Map<QueryType, string>([
  [QueryType.GET_CREDENTIALS_QUERY, GET_CREDENTIALS_QUERY],
  [QueryType.GET_PROFILES_NS, GET_PROFILES_NS],
  [QueryType.GET_PROFILES, GET_PROFILES],
  [QueryType.GET_REFRESH_PROFILE, GET_REFRESH_PROFILE],
  [QueryType.GET_DOMAIN, GET_DOMAIN],
  [QueryType.GET_DOMAIN_SINGLE, GET_DOMAIN_SINGLE],
  [QueryType.GET_BATCH, GET_BATCH],
  [QueryType.GET_BATCH_UNIVERSAL, GET_BATCH_UNIVERSAL],
  [QueryType.GET_AVAILABLE_DOMAINS, GET_AVAILABLE_DOMAINS],
  [QueryType.GET_SEARCH_SUGGEST, GET_SEARCH_SUGGEST],
  [QueryType.GET_SEARCH_QUERY, GET_SEARCH_QUERY],
  [QueryType.GET_WALLET_QUERY, GET_WALLET_QUERY],
]);

export function getQuery(type: QueryType): string {
  const query = QUERY_MAP.get(type);
  if (!query) {
    throw new Error(`Unknown query type: ${type}`);
  }
  return query;
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
    const response = await fetch(IDENTITY_GRAPH_SERVER, {
      method: "POST",
      headers: {
        ...headers,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: getQuery(query),
        variables: {
          identity: handle,
          platform,
        },
      }),
    });

    if (!response.ok) {
      return {
        errors: `HTTP ${response.status}: ${response.statusText}`,
        code: response.status,
      };
    }

    return await response.json();
  } catch (error) {
    return {
      errors: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

export async function queryBatchUniversal(ids: string[], headers: AuthHeaders) {
  const queryIds = resolveIdentityBatch(ids);
  if (queryIds.length === 0) {
    return [];
  }

  try {
    const response = await fetch(IDENTITY_GRAPH_SERVER, {
      method: "POST",
      headers: {
        ...headers,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: getQuery(QueryType.GET_BATCH_UNIVERSAL),
        variables: { ids: queryIds },
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const json = await response.json();
    const identities = json?.data?.identitiesWithGraph;

    if (!Array.isArray(identities)) {
      return [];
    }

    const identityMap = new Map(
      identities
        .filter((x) => !!x)
        .map((identity) => [
          `${identity.platform},${identity.identity}`,
          identity,
        ]),
    );

    const results = await Promise.all(
      queryIds.map(async (id) => {
        const matchingIdentity = identityMap.get(id);
        if (!matchingIdentity) {
          return { id, profiles: [] };
        }

        try {
          const resolvedResult = await resolveWithIdentityGraph({
            handle: matchingIdentity.identity,
            platform: matchingIdentity.platform,
            ns: true,
            response: {
              data: {
                identity: matchingIdentity,
              },
            },
          });

          if (resolvedResult && !(resolvedResult as any).message) {
            return {
              id,
              profiles: [...(resolvedResult as NSResponse[])],
            };
          }
        } catch (error) {
          // Silent fail for individual identity resolution
        }

        return { id, profiles: [] };
      }),
    );

    return results.filter((result) => result.profiles.length > 0);
  } catch (e) {
    throw new Error(ErrorMessages.NOT_FOUND, { cause: { code: 404 } });
  }
}

export async function queryIdentityGraphBatch(
  ids: string[],
  ns: boolean,
  headers: AuthHeaders,
) {
  const queryIds = resolveIdentityBatch(ids);
  if (queryIds.length === 0) {
    return [];
  }

  try {
    const response = await fetch(IDENTITY_GRAPH_SERVER, {
      method: "POST",
      headers: {
        ...headers,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: getQuery(QueryType.GET_BATCH),
        variables: { ids: queryIds },
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const json = await response.json();

    if (!json?.data?.identities) {
      return json || [];
    }

    const processedResults = await Promise.allSettled(
      json.data.identities.map(
        async (identity: {
          profile: ProfileRecord;
          aliases: IdentityString[];
          registeredAt: number;
        }) => {
          const profileStruct = await generateProfileStruct(
            {
              ...identity.profile,
              createdAt: identity.registeredAt,
            },
            ns,
          );

          return {
            ...profileStruct,
            aliases: identity.aliases,
          };
        },
      ),
    );

    const validResults = processedResults
      .filter(
        (result): result is PromiseFulfilledResult<any> =>
          result.status === "fulfilled",
      )
      .map((result) => result.value);

    const resultMap = new Map(
      validResults.map((result) => [
        result.aliases?.find((alias: string) => queryIds.includes(alias)) ||
          `${result.platform},${normalizeText(result.identity)}`,
        result,
      ]),
    );

    return queryIds
      .map((queryId) => {
        if (resultMap.has(queryId)) {
          return resultMap.get(queryId);
        }

        const [platform, identity] = queryId.split(",");
        return (
          validResults.find(
            (result) =>
              result.platform === platform &&
              normalizeText(result.identity) === normalizeText(identity),
          ) || null
        );
      })
      .filter(Boolean);
  } catch (error) {
    throw new Error(ErrorMessages.NOT_FOUND, { cause: { code: 404 } });
  }
}
