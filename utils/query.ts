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

export const GET_PROFILES = (single?: boolean) => `
  query GET_PROFILES($platform: Platform!, $identity: String!) {
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
          contenthash
          texts
          addresses {
            network
            address
          }
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
              addresses {
                network
                address
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
        }`
            : ``
        }
      }
  }
`;

export const primaryDomainResolvedRequestArray = (
  data: IdentityGraphQueryResponse,
  handle: string,
  platform: PlatformType
) => {
  const resolvedRecord = data?.data?.identity;
  if (resolvedRecord) {
    const defaultReturn = resolvedRecord.profile
      ? {
          ...resolvedRecord.profile,
          isPrimary: resolvedRecord.isPrimary,
        }
      : {
          address: resolvedRecord.resolvedAddress?.[0]?.address || null,
          identity: resolvedRecord.identity,
          platform: resolvedRecord.platform,
          displayName: formatText(resolvedRecord.identity),
          isPrimary: resolvedRecord.isPrimary,
        };
    if (PLATFORMS_TO_EXCLUDE.includes(platform)) {
      return [defaultReturn];
    }
    if (
      directPass(resolvedRecord) &&
      !(
        resolvedRecord.platform === PlatformType.basenames &&
        resolvedRecord.ownerAddress[0]?.address !==
          resolvedRecord.resolvedAddress[0]?.address
      ) &&
      resolvedRecord.identityGraph?.vertices?.length > 0
    ) {
      const vertices = resolvedRecord.identityGraph.vertices;

      const resolved = vertices
        .filter((x) => directPass(x))
        .filter((x) => {
          if (x.platform === PlatformType.ens) {
            return (
              x.ownerAddress?.[0]?.address === x.resolvedAddress?.[0]?.address
            );
          } else {
            return true;
          }
        })
        .map((x) => ({
          ...x.profile,
          isPrimary: x.isPrimary,
        }));
      return [...resolved];
    }

    if (
      [
        PlatformType.ethereum,
        PlatformType.ens,
        PlatformType.basenames,
        PlatformType.unstoppableDomains,
        PlatformType.dotbit,
        PlatformType.twitter,
        PlatformType.linea,
        PlatformType.nextid,
      ].includes(resolvedRecord.platform)
    ) {
      const vertices =
        resolvedRecord.identityGraph?.vertices
          .filter((x) => {
            if (
              x.isPrimary ||
              [PlatformType.farcaster, PlatformType.lens].includes(x.platform)
            ) {
              if (
                [PlatformType.twitter, PlatformType.nextid].includes(
                  resolvedRecord.platform
                )
              )
                return true;
              const sourceAddr =
                resolvedRecord.platform === PlatformType.ethereum
                  ? resolvedRecord.identity
                  : resolvedRecord.resolvedAddress[0]?.address;
              return (
                isSameAddress(x.profile?.address, sourceAddr) ||
                x.profile?.addresses?.some((i) =>
                  isSameAddress(i?.address, sourceAddr)
                )
              );
            }
          })
          .map((x) => ({
            ...x.profile,
            isPrimary: x.isPrimary,
          })) || [];

      return [
        PlatformType.ethereum,
        PlatformType.twitter,
        PlatformType.nextid,
      ].includes(resolvedRecord.platform)
        ? [...vertices]
        : [...vertices, defaultReturn];
    }
    return [defaultReturn];
  }
  return [
    {
      identity: handle,
      platform: platform,
      isPrimary: null,
    },
  ];
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
      addresses {
        network
        address
      }
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
          addresses {
            network
            address
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
