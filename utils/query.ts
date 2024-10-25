import { NEXTID_GRAPHQL_ENDPOINT } from "@/app/api/profile/[handle]/utils";
import { PLATFORMS_TO_EXCLUDE, handleSearchPlatform } from "./base";
import { PlatformType } from "./platform";
import { IdentityRecord, RelationServiceQueryResponse } from "./types";

const directPass = (identity: IdentityRecord) => {
  if (identity.isPrimary) return true;
  return [PlatformType.farcaster, PlatformType.lens].includes(
    identity.platform
  );
};

export const GET_SINGLE_PROFILE = `
 query GET_SINGLE_PROFILE($platform: Platform!, $identity: String!) {
      identity(platform: $platform, identity: $identity) {
        identity
        platform
        isPrimary
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
  }
`;

export const GET_PROFILES = `
  query GET_PROFILES($platform: Platform!, $identity: String!) {
      identity(platform: $platform, identity: $identity) {
        identity
        platform
        isPrimary
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
        }
      }
  }
`;

export const primaryDomainResolvedRequestArray = (
  data: RelationServiceQueryResponse,
  handle: string,
  platform: PlatformType
) => {
  const resolvedRecord = data?.data?.identity;
  if (resolvedRecord) {
    const defaultReturn = {
      ...resolvedRecord.profile,
      isPrimary: resolvedRecord.isPrimary,
    };
    if (PLATFORMS_TO_EXCLUDE.includes(platform)) {
      return [defaultReturn];
    }
    if (
      (directPass(resolvedRecord) ||
        resolvedRecord.platform === PlatformType.nextid) &&
      resolvedRecord.identityGraph.vertices.length > 0
    ) {
      const vertices = resolvedRecord.identityGraph?.vertices;
      const resolved = vertices
        .filter((x) => directPass(x))
        .filter((x) => x.platform !== PlatformType.ethereum)
        .filter((x) => {
          if (x.platform === PlatformType.ens) {
            const ownerAddress = x.ownerAddress[0].address;
            const resolvedAddress = x.resolvedAddress.find(
              (i) => i.network === x.ownerAddress[0].network
            )?.address;
            return ownerAddress === resolvedAddress;
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
      [PlatformType.ethereum, PlatformType.ens].includes(
        resolvedRecord.platform
      )
    ) {
      const vertices =
        resolvedRecord.identityGraph?.vertices
          .filter((x) =>
            [PlatformType.lens, PlatformType.farcaster].includes(x.platform)
          )
          .map((x) => ({
            ...x.profile,
            isPrimary: null,
          })) || [];
      return [...vertices, defaultReturn];
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

export const BATCH_GET_PROFILES = `
  query BATCH_GET_PROFILES($ids: [String!]!) {
  identities(ids: $ids) {
    profile {
      uid
      identity
      platform
      network
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
        following
        follower
      }
    }
  }
}
`;

export async function queryIdentityGraph(
  handle: string,
  platform: PlatformType = handleSearchPlatform(handle)!
): Promise<any> {
  try {
    const response = await fetch(NEXTID_GRAPHQL_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: GET_SINGLE_PROFILE,
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
