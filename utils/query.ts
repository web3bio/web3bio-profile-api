import { IDENTITY_GRAPH_SERVER } from "@/app/api/profile/[handle]/utils";
import { handleSearchPlatform } from "./base";
import { PlatformType } from "./platform";
import { AuthHeaders } from "./types";

export const GET_CREDENTIALS_QUERY = `
 query GET_CREDENTIALS_QUERY($platform: Platform!, $identity: String!) {
    identity(platform: $platform, identity: $identity) {
     	identityGraph{
        vertices{
          id
          credentials{
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
`;

export const GET_GRAPH_QUERY = `
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
`;

export const GET_PROFILES = (single?: boolean) => `
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
        ${
          !single
            ? `identityGraph {
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
        }`
            : ``
        }
      }
  }
`;

export const BATCH_GET_UNIVERSAL = `
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
`;

export async function queryIdentityGraph(
  handle: string,
  platform: PlatformType = handleSearchPlatform(handle)!,
  query: string,
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
        query,
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
