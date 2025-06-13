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
              updatedAt
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
  [QueryType.GET_BATCH]: `
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
  `,
  [QueryType.GET_DOMAIN]: `
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
  `,
};

export async function queryIdentityGraph(
  query: QueryType,
  handle: string,
  platform: Platform = detectPlatform(handle)!,
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
    const queryIds = resolveIdentityBatch(ids);
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

    const json = await response.json();
    if (!json || json?.code || !json.data.identities) return json;

    const results = (
      await Promise.allSettled(
        json.data.identities.map(
          async (x: {
            profile: ProfileRecord;
            aliases: IdentityString[];
            registeredAt: number;
          }) => {
            return {
              ...(await generateProfileStruct(
                {
                  ...x.profile,
                  createdAt: x.registeredAt,
                },
                ns,
              )),
              aliases: x.aliases,
            };
          },
        ),
      )
    )
      .map((x) => {
        if (x.status === "fulfilled") return x.value;
        return null;
      })
      .filter(Boolean);

    return queryIds
      .map((x) =>
        results.find((i) => {
          if (i.aliases.includes(x)) return i;
          const [_platform, _identity] = x.split(",");
          if (
            i.platform === _platform &&
            normalizeText(i.identity) === normalizeText(_identity)
          )
            return i;
          return null;
        }),
      )
      .filter(Boolean);
  } catch (e) {
    throw new Error(ErrorMessages.NOT_FOUND, { cause: 404 });
  }
}
