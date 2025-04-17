import { handleSearchPlatform, IDENTITY_GRAPH_SERVER } from "./base";
import { PlatformType } from "./platform";
import { AuthHeaders, ErrorMessages } from "./types";
import { resolveWithIdentityGraph } from "../app/api/profile/[handle]/utils";

export enum QueryType {
  GET_CREDENTIALS_QUERY = "GET_CREDENTIALS_QUERY",
  GET_GRAPH_QUERY = "GET_GRAPH_QUERY",
  GET_PROFILES_NS = "GET_PROFILES_NS",
  GET_PROFILES = "GET_PROFILES",
  BATCH_GET_UNIVERSAL = "BATCH_GET_UNIVERSAL",
  GET_REFRESH_PROFILE = "GET_REFRESH_PROFILE",
}

export function getQuery(type: QueryType): string {
  return QUERIES[type];
}

const QUERIES = {
  [QueryType.GET_CREDENTIALS_QUERY]: `
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
            }
          }
        }
      }
    }
  `,
  [QueryType.GET_GRAPH_QUERY]: `
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
  `,
  [QueryType.GET_PROFILES_NS]: `
    query GET_PROFILES_NS($platform: Platform!, $identity: String!) {
      identity(platform: $platform, identity: $identity) {
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
  `,
  [QueryType.GET_PROFILES]: `
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
  `,
  [QueryType.BATCH_GET_UNIVERSAL]: `
    query BATCH_GET_UNIVERSAL($ids: [String!]!) {
      identitiesWithGraph(ids: $ids) {
        id
        aliases
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
          contenthash
          texts
          social {
            uid
            follower
            following
          }
        }
        identityGraph {
          graphId
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
  `,
  [QueryType.GET_REFRESH_PROFILE]: `
    query GET_REFRESH_PROFILE($platform: Platform!, $identity: String!) {
      identity(platform: $platform, identity: $identity, refresh: true) {
        status
        identityGraph {
          graphId
        }
      }
    }
  `,
};

export async function queryIdentityGraph(
  query: QueryType,
  handle: string,
  platform: PlatformType = handleSearchPlatform(handle)!,
  headers: AuthHeaders,
): Promise<any> {
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

    return await response.json();
  } catch (e) {
    return { errors: e };
  }
}

export async function queryIdentityGraphBatch(
  ids: string[],
  ns: boolean,
  headers: AuthHeaders,
) {
  try {
    const response = await fetch(IDENTITY_GRAPH_SERVER, {
      method: "POST",
      headers: {
        ...headers,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: getQuery(QueryType.BATCH_GET_UNIVERSAL),
        variables: { ids },
      }),
    });

    const json = await response.json();
    if (!json || json?.code) return json;
    // Process all identities in parallel
    const responses = await Promise.allSettled(
      (json.data.identitiesWithGraph || []).map(async (item: any) => {
        const [platform, handle] = item.id.split(",");
        const profiles = (await resolveWithIdentityGraph({
          handle,
          platform,
          ns,
          response: { data: { identity: { ...item } } },
        })) as any;
        if (profiles?.[0]) {
          return {
            ...profiles[0],
            aliases: item.aliases,
          };
        }
      }),
    );
    return responses
      .filter((x) => x.status === "fulfilled")
      .map((x) => (x as any).value);
  } catch (e) {
    throw new Error(ErrorMessages.notFound, { cause: 404 });
  }
}
