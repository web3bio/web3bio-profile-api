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
    identity.platform
  );
};

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

export const primaryDomainResolvedRequestArray = (
  data: IdentityGraphQueryResponse,
  platform: PlatformType
) => {
  const resolvedRecord = data?.data?.identity;

  if (!resolvedRecord) {
    return [];
  }

  const {
    identity,
    platform: recordPlatform,
    resolvedAddress,
    identityGraph,
    profile,
  } = resolvedRecord;
  const defaultReturn = profile
    ? {
        ...profile,
        isPrimary: resolvedRecord.isPrimary,
        displayName: profile.displayName || formatText(identity),
      }
    : {
        address: resolvedAddress?.[0]?.address || null,
        identity,
        platform: recordPlatform,
        displayName: formatText(identity),
        isPrimary: resolvedRecord.isPrimary,
      };

  if (PLATFORMS_TO_EXCLUDE.includes(platform)) {
    return [defaultReturn];
  }

  if (
    directPass(resolvedRecord) &&
    !(
      recordPlatform === PlatformType.basenames &&
      resolvedRecord.ownerAddress[0]?.address !== resolvedAddress[0]?.address
    ) &&
    identityGraph?.vertices?.length > 0
  ) {
    const resolved = identityGraph.vertices
      .filter(
        (x) =>
          directPass(x) &&
          (x.platform !== PlatformType.ens ||
            x.ownerAddress?.[0]?.address === x.resolvedAddress?.[0]?.address)
      )
      .map((x) => ({ ...x.profile, isPrimary: x.isPrimary }));

    return resolved;
  }

  const validPlatforms = [
    PlatformType.ethereum,
    PlatformType.ens,
    PlatformType.basenames,
    PlatformType.unstoppableDomains,
    PlatformType.dotbit,
    PlatformType.twitter,
    PlatformType.linea,
    PlatformType.nextid,
  ];

  if (validPlatforms.includes(recordPlatform)) {
    const vertices =
      identityGraph?.vertices
        .filter((x) => {
          if (
            x.isPrimary ||
            [PlatformType.farcaster, PlatformType.lens].includes(x.platform)
          ) {
            if (
              [PlatformType.twitter, PlatformType.nextid].includes(
                recordPlatform
              )
            ) {
              return true;
            }

            const sourceAddr =
              recordPlatform === PlatformType.ethereum
                ? identity
                : resolvedAddress[0]?.address;

            return x.platform === PlatformType.farcaster
              ? x.ownerAddress?.find((i) =>
                  isSameAddress(i.address, sourceAddr)
                )
              : isSameAddress(x.resolvedAddress?.[0]?.address, sourceAddr);
          }
        })
        .map((x) => ({ ...x.profile, isPrimary: x.isPrimary })) || [];
    if (
      (recordPlatform === PlatformType.ethereum &&
        !vertices.some((x) =>
          isSameAddress(x.address, resolvedRecord.identity)
        )) ||
      ![
        PlatformType.ethereum,
        PlatformType.twitter,
        PlatformType.nextid,
      ].includes(recordPlatform)
    ) {
      return [...vertices, defaultReturn];
    }

    return vertices;
  }

  return [defaultReturn];
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
  headers: AuthHeaders
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
