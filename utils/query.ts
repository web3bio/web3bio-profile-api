import { IDENTITY_GRAPH_SERVER } from "@/app/api/profile/[handle]/utils";
import {
  PLATFORMS_TO_EXCLUDE,
  formatText,
  handleSearchPlatform,
  isSameAddress,
} from "./base";
import { PlatformType } from "./platform";
import {
  IdentityRecord,
  IdentityGraphQueryResponse,
  AuthHeaders,
} from "./types";

const directPass = (identity: IdentityRecord) => {
  if (identity.isPrimary && identity.platform !== PlatformType.linea)
    return true;
  return [PlatformType.farcaster, PlatformType.lens].includes(
    identity.platform,
  );
};

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

const VALID_PLATFORMS = new Set([
  PlatformType.ethereum,
  PlatformType.ens,
  PlatformType.basenames,
  PlatformType.unstoppableDomains,
  PlatformType.dotbit,
  PlatformType.twitter,
  PlatformType.linea,
  PlatformType.nextid,
]);

const SOCIAL_PLATFORMS = new Set([PlatformType.farcaster, PlatformType.lens]);
const INCLUSIVE_PLATFORMS = new Set([
  PlatformType.twitter,
  PlatformType.nextid,
]);

export const getResolvedProfileArray = (
  data: IdentityGraphQueryResponse,
  platform: PlatformType,
) => {
  const resolvedRecord = data?.data?.identity;
  if (!resolvedRecord) return [];

  const {
    identity,
    platform: recordPlatform,
    resolvedAddress,
    identityGraph,
    profile,
    isPrimary,
    ownerAddress,
  } = resolvedRecord;

  const firstResolvedAddress = resolvedAddress?.[0]?.address;
  const firstOwnerAddress = ownerAddress?.[0]?.address;

  const defaultReturn = profile
    ? {
        ...profile,
        isPrimary,
        displayName: profile.displayName || formatText(identity),
      }
    : {
        address: firstResolvedAddress || null,
        identity,
        platform: recordPlatform,
        displayName: formatText(identity),
        isPrimary,
      };

  if (PLATFORMS_TO_EXCLUDE.includes(platform)) {
    return [defaultReturn];
  }

  // Handle direct pass case
  const isBadBasename =
    recordPlatform === PlatformType.basenames &&
    firstOwnerAddress !== firstResolvedAddress;

  const vertices = identityGraph?.vertices;
  if (!vertices?.length) {
    return [defaultReturn];
  }

  let results = [];

  if (directPass(resolvedRecord) && !isBadBasename) {
    results = vertices
      .filter((vertex) => {
        if (!directPass(vertex)) return false;
        if (vertex.platform === PlatformType.ens) {
          const vertexOwnerAddr = vertex.ownerAddress?.[0]?.address;
          const vertexResolvedAddr = vertex.resolvedAddress?.[0]?.address;
          return vertexOwnerAddr === vertexResolvedAddr;
        }
        return true;
      })
      .map((vertex) => ({
        ...vertex.profile,
        isPrimary: vertex.isPrimary,
      }));
  } else if (VALID_PLATFORMS.has(recordPlatform)) {
    // Get source address for comparison only once
    const sourceAddr =
      recordPlatform === PlatformType.ethereum
        ? identity
        : firstResolvedAddress;

    // Filter vertices according to platform rules
    results = vertices
      .filter((vertex) => {
        // Skip non-matching vertices quickly
        if (!vertex.isPrimary && !SOCIAL_PLATFORMS.has(vertex.platform)) {
          return false;
        }

        // For inclusive platforms, include everything primary or social
        if (INCLUSIVE_PLATFORMS.has(recordPlatform)) {
          return true;
        }

        // Address comparison logic
        if (vertex.platform === PlatformType.farcaster) {
          return (
            vertex.ownerAddress?.some((addr) =>
              isSameAddress(addr.address, sourceAddr),
            ) ?? false
          );
        }

        return isSameAddress(vertex.resolvedAddress?.[0]?.address, sourceAddr);
      })
      .map((vertex) => ({
        ...vertex.profile,
        isPrimary: vertex.isPrimary,
      }));

    if (
      (recordPlatform === PlatformType.ethereum &&
        !results.some((x) => x.isPrimary && x.platform === PlatformType.ens)) ||
      !(
        INCLUSIVE_PLATFORMS.has(recordPlatform) ||
        recordPlatform === PlatformType.ethereum
      )
    ) {
      results = [...results, defaultReturn];
    }
  } else {
    results = [defaultReturn];
  }

  return results
    .filter(
      (item, index, self) =>
        index ===
        self.findIndex(
          (i) => i.platform === item.platform && i.identity === item.identity,
        ),
    )
    .sort((a, b) => Number(b.isPrimary) - Number(a.isPrimary));
};

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
