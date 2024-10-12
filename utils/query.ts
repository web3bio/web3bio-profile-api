import { PLATFORMS_TO_EXCLUDE } from "./base";
import { PlatformType } from "./platform";
import { IdentityRecord, RelationServiceQueryResponse } from "./types";

const directPass = (identity: IdentityRecord) => {
  if (identity.reverse) return true;
  return [PlatformType.farcaster, PlatformType.lens].includes(
    identity.platform
  );
};

export const GET_PROFILES = `
query GET_PROFILES($platform: String, $identity: String) {
  identity(platform: $platform, identity: $identity) {
    identity
    platform
    displayName
    uid
    reverse
    expiredAt
    identityGraph{
      vertices {
        uuid
        identity
        platform
        displayName
        uid
        reverse
        expiredAt
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
  if (data?.data?.identity) {
    const resolvedRecord = data?.data?.identity;
    const defaultReturn = {
      identity: resolvedRecord.identity,
      platform: resolvedRecord.platform,
      reverse: false,
    };
    if (PLATFORMS_TO_EXCLUDE.includes(platform)) {
      return [defaultReturn];
    }
    if (
      (directPass(resolvedRecord) ||
        resolvedRecord.platform === PlatformType.nextid) &&
      resolvedRecord.identityGraph?.vertices?.length > 0
    ) {
      const vertices = resolvedRecord.identityGraph?.vertices;
      const resolved = vertices
        .filter((x) => directPass(x))
        .filter((x) => x.platform !== PlatformType.ethereum)
        .map((x) => ({
          identity: x.identity,
          platform: x.platform,
          reverse: x.reverse,
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
            identity: x.identity,
            platform: x.platform,
            reverse: null,
          })) || [];
      return [...vertices, defaultReturn];
    }
    return [defaultReturn];
  }
  return [
    {
      identity: handle,
      platform: platform,
      reverse: null,
    },
  ];
};

// todo: checkout this field
export const BATCH_GET_PROFILES = `
  query {
  identities(ids: [
    "ens,sujiyan.eth",
    "ethereum,0x934b510d4c9103e6a87aef13b816fb080286d649",
  ]) {
    id
    identity
    platform
    network
    primaryName
    isPrimary
    resolvedAddress {
      network
      address
    }
    ownerAddress {
      network
      address
    }
    expiredAt
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
        updateAt
      }
    }
  }
}
`;
