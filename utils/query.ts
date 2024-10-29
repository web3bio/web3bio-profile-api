import { NEXTID_GRAPHQL_ENDPOINT } from "@/app/api/profile/[handle]/utils";
import { PLATFORMS_TO_EXCLUDE, handleSearchPlatform } from "./base";
import { PlatformType } from "./platform";
import { IdentityRecord, IdentityGraphQueryResponse } from "./types";

const directPass = (identity: IdentityRecord) => {
  if (identity.isPrimary) return true;
  return identity.platform === PlatformType.farcaster;
};

export const GET_PROFILES = (single?: boolean) => `
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
            aliases
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
    const defaultReturn = {
      ...resolvedRecord.profile,
      isPrimary: resolvedRecord.isPrimary,
    };
    if (PLATFORMS_TO_EXCLUDE.includes(platform)) {
      return [defaultReturn];
    }
    if (
      directPass(resolvedRecord) &&
      resolvedRecord.identityGraph.vertices.length > 0
    ) {
      const vertices = resolvedRecord.identityGraph?.vertices;
      const resolved = vertices
        .filter((x) => directPass(x))
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
          .filter((x) => x.platform === PlatformType.farcaster)
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
    aliases
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
  platform: PlatformType = handleSearchPlatform(handle)!,
  query: string
): Promise<any> {
  try {
    const response = await fetch(NEXTID_GRAPHQL_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: process.env.NEXT_PUBLIC_IDENTITY_GRAPH_API_KEY || "",
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
