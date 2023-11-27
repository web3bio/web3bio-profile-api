import { PlatformType, supportedPlatforms } from "./platform";
import {
  RelationServiceDomainQueryResponse,
  RelationServiceIdentityQueryResponse,
} from "./types";
import { isDomainSearch } from "./utils";

export const getRelationQuery = (platform: PlatformType) => {
  return isDomainSearch(platform) ? GET_PROFILES_DOMAIN : GET_PROFILES_QUERY;
};
const GET_PROFILES_DOMAIN = `
query GET_PROFILES_DOMAIN($platform: String, $identity: String) {
  domain(domainSystem: $platform, name: $identity) {
		source
		system
		name
    reverse
		resolved {
			identity
			platform
			displayName
      uuid
      neighbor(depth: 2) {
        sources # Which upstreams provide these connection infos.
        reverse
        identity {
          uuid
          platform
          identity
          displayName
        }
      }
		}

	}
}
`;
``;

export const GET_PROFILES_QUERY = `
query GET_PROFILES_QUERY($platform: String, $identity: String) {
  identity(platform: $platform, identity: $identity) {
    platform
    identity
    displayName
    uuid
    reverseRecords{
      source
      system
      name
      reverse
    }
    neighbor(depth: 1) {
      sources # Which upstreams provide these connection infos.
      reverse
      identity {
        uuid
        platform
        identity
        displayName
      }
    }
  }
}
`;

export const primaryDomainResolvedRequestArray = (
  data: RelationServiceDomainQueryResponse,
  handle: string,
  platform: PlatformType
) => {
  const defaultReturn = {
    identity: handle,
    platform: platform,
  };
  if (data.data.domain.reverse) {
    const resolved = data?.data?.domain?.resolved?.neighbor
      .filter(
        (x) => x.reverse || x.identity.platform === PlatformType.farcaster
      )
      .map((x) => ({
        identity: x.identity.identity,
        platform: x.identity.platform,
      }));
    return [...(resolved || []), defaultReturn];
  }
  return [defaultReturn];
};

export const primaryIdentityResolvedRequestArray = (
  data: RelationServiceIdentityQueryResponse
) => {
  if (data.data.identity.platform === PlatformType.ethereum) {
    const defaultReturn = {
      identity: data.data.identity.identity,
      platform: PlatformType.ens,
    };
    const reverseFromNeighbor = data.data.identity.neighbor
      .filter(
        (x) => x.reverse || x.identity.platform === PlatformType.farcaster
      )
      .map((x) => ({
        identity: data.data.identity.identity,
        platform: x.identity.platform,
      }));
    return [...reverseFromNeighbor, defaultReturn];
  } else {
    const defaultReturn = {
      identity: data?.data?.identity?.identity,
      platform: data?.data?.identity?.platform,
    };
    const reverseFromNeighbor = data?.data?.identity?.neighbor
      .filter(
        (x) =>
          x.reverse ||
          (x.identity.platform === PlatformType.ethereum &&
            x.identity.displayName)
      )
      .map((x) => ({
        identity: x.identity.identity,
        platform: x.identity.platform.replace(
          PlatformType.ethereum,
          PlatformType.ens
        ),
      }));
    return [...reverseFromNeighbor, defaultReturn];
  }
};
