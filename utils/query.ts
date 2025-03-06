import {
  handleSearchPlatform,
  IDENTITY_GRAPH_SERVER,
  formatText,
  isWeb3Address,
} from "./base";
import { PlatformType } from "./platform";
import {
  AuthHeaders,
  ErrorMessages,
  ProfileAPIResponse,
  ProfileNSResponse,
} from "./types";
import { generateProfileStruct } from "@/utils/utils";
import { resolveWithIdentityGraph } from "../app/api/profile/[handle]/utils";

export enum QueryType {
  GET_CREDENTIALS_QUERY = "GET_CREDENTIALS_QUERY",
  GET_GRAPH_QUERY = "GET_GRAPH_QUERY",
  GET_PROFILES_NS = "GET_PROFILES_NS",
  GET_PROFILES = "GET_PROFILES",
  BATCH_GET_UNIVERSAL = "BATCH_GET_UNIVERSAL",
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
        updatedAt
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
            expiredAt
            updatedAt
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
        expiredAt
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
            expiredAt
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

export async function fetchIdentityGraphBatch(
  ids: string[],
  ns: boolean,
  headers: AuthHeaders,
): Promise<
  ProfileAPIResponse[] | ProfileNSResponse[] | { error: { message: string } }
> {
  try {
    const response = await fetch(IDENTITY_GRAPH_SERVER, {
      method: "POST",
      headers: {
        ...headers,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: getQuery(QueryType.BATCH_GET_UNIVERSAL),
        variables: {
          ids: ids,
        },
      }),
    });

    const json = await response.json();
    if (json.code) return json;
    let res = [] as any;
    if (json?.data?.identitiesWithGraph?.length > 0) {
      for (let i = 0; i < json.data.identitiesWithGraph.length; i++) {
        const item = json.data.identitiesWithGraph[i];
        if (item) {
          res.push({
            ...(await generateProfileStruct(
              item.profile || {
                address: isWeb3Address(item.identity) ? item.identity : null,
                identity: item.identity,
                platform: item.platform,
                displayName: isWeb3Address(item.identity)
                  ? formatText(item.identity)
                  : item.identity,
              },
              ns,
              item.identityGraph?.edges,
            )),
            aliases: item.aliases,
          });
        }
      }
    }
    return res;
  } catch (e: any) {
    throw new Error(ErrorMessages.notFound, { cause: 404 });
  }
}

export async function fetchUniversalBatch(
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
        variables: {
          ids: ids,
        },
      }),
    });

    const json = await response.json();
    if (!json || json?.code) return json;
    const res = [];
    for (let i = 0; i < json.data.identitiesWithGraph?.length; i++) {
      const item = json.data.identitiesWithGraph[i];
      const platform = item.id.split(",")[0];
      const handle = item.id.split(",")[1];
      res.push({
        id: item.id,
        aliases: item.aliases,
        profiles: await resolveWithIdentityGraph({
          handle,
          platform,
          ns,
          response: { data: { identity: { ...item } } },
        }),
      });
    }

    return res;
  } catch (e: any) {
    throw new Error(ErrorMessages.notFound, { cause: 404 });
  }
}
