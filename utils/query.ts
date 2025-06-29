import {
  ErrorMessages,
  IdentityString,
  type Platform,
} from "web3bio-profile-kit/types";
import { detectPlatform } from "web3bio-profile-kit/utils";
import { IDENTITY_GRAPH_SERVER, normalizeText } from "./utils";
import { ProfileRecord, type AuthHeaders } from "./types";
import { generateProfileStruct, resolveIdentityBatch } from "./base";

export enum QueryType {
  GET_CREDENTIALS_QUERY = "GET_CREDENTIALS_QUERY",
  GET_GRAPH_QUERY = "GET_GRAPH_QUERY",
  GET_PROFILES_NS = "GET_PROFILES_NS",
  GET_PROFILES = "GET_PROFILES",
  GET_REFRESH_PROFILE = "GET_REFRESH_PROFILE",
  GET_DOMAIN = "GET_DOMAIN",
  GET_BATCH = "GET_BATCH",
}

// Pre-compiled query strings as constants for better performance
const GET_CREDENTIALS_QUERY = `
  query GET_CREDENTIALS_QUERY($platform: Platform!, $identity: String!) {
    identity(platform: $platform, identity: $identity) {
      identityGraph {
        vertices {
          id
          credentials {
            category
            type
            value
            platform
            dataSource
            link
            updatedAt
          }
        }
      }
    }
  }
`;

const GET_GRAPH_QUERY = `
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
        contenthash
        texts
        social {
          uid
          follower
          following
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
            contenthash
            texts
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
        identity
        platform
        address
        displayName
        contenthash
        texts
        addresses {
          network
          address
        }
      }
    }
  }
`;

// Use Map for O(1) lookup instead of object property access
const QUERY_MAP = new Map([
  [QueryType.GET_CREDENTIALS_QUERY, GET_CREDENTIALS_QUERY],
  [QueryType.GET_GRAPH_QUERY, GET_GRAPH_QUERY],
  [QueryType.GET_PROFILES_NS, GET_PROFILES_NS],
  [QueryType.GET_PROFILES, GET_PROFILES],
  [QueryType.GET_REFRESH_PROFILE, GET_REFRESH_PROFILE],
  [QueryType.GET_DOMAIN, GET_DOMAIN],
  [QueryType.GET_BATCH, GET_BATCH],
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
      };
    }

    return await response.json();
  } catch (error) {
    return {
      errors: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

export async function queryIdentityGraphBatch(
  ids: string[],
  ns: boolean,
  headers: AuthHeaders,
) {
  try {
    const queryIds = resolveIdentityBatch(ids);

    if (queryIds.length === 0) {
      return [];
    }

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

    // Early return for error cases
    if (!json?.data?.identities) {
      return json || [];
    }

    // Process identities concurrently with proper error handling
    const processedResults = await Promise.allSettled(
      json.data.identities.map(
        async (identity: {
          profile: ProfileRecord;
          aliases: IdentityString[];
          registeredAt: number;
        }) => {
          try {
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
          } catch (error) {
            console.warn("Failed to process identity:", error);
            return null;
          }
        },
      ),
    );

    // Extract successful results only
    const validResults = processedResults
      .filter(
        (result): result is PromiseFulfilledResult<any> =>
          result.status === "fulfilled" && result.value !== null,
      )
      .map((result) => result.value);

    // Map query IDs to results with optimized lookup
    const resultMap = new Map(
      validResults.map((result) => [
        result.aliases?.find((alias: string) => queryIds.includes(alias)) ||
          `${result.platform},${normalizeText(result.identity)}`,
        result,
      ]),
    );

    return queryIds
      .map((queryId) => {
        // Direct lookup first
        if (resultMap.has(queryId)) {
          return resultMap.get(queryId);
        }

        // Fallback to platform,identity matching
        const [platform, identity] = queryId.split(",");
        for (const result of validResults) {
          if (
            result.platform === platform &&
            normalizeText(result.identity) === normalizeText(identity)
          ) {
            return result;
          }
        }
        return null;
      })
      .filter(Boolean);
  } catch (error) {
    console.error("Batch query failed:", error);
    throw new Error(ErrorMessages.NOT_FOUND, { cause: 404 });
  }
}
