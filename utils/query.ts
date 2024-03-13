import { PlatformType } from "./platform";
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
    reverse
    system
		resolved {
			identity
			platform
			displayName
      neighbor(depth:3) {
        reverse
        identity {
          platform
          identity
          displayName
        }
      }
		}
	}
}
`;

export const GET_PROFILES_QUERY = `
query GET_PROFILES_QUERY($platform: String, $identity: String) {
  identity(platform: $platform, identity: $identity) {
    platform
    identity
    displayName
    neighbor(depth:3) {
      reverse
      identity {
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
    reverse: data.data.domain.reverse,
  };

  if (
    (data.data.domain.reverse ||
      data.data.domain.system === PlatformType.lens) &&
    data.data.domain.resolved
  ) {
    const resolved = data?.data?.domain?.resolved?.neighbor
      .filter(
        (x) =>
          x.reverse ||
          [PlatformType.farcaster, PlatformType.lens].includes(
            x.identity.platform
          )
      )
      .map((x) => ({
        identity: x.identity.identity,
        platform: x.identity.platform,
        reverse: x.reverse,
      }));
    return [
      ...(resolved || []),
      {
        identity: data.data.domain.resolved.identity,
        platform: data.data.domain.resolved.platform,
        reverse: data.data.domain.reverse,
      },
    ];
  }
  return [defaultReturn];
};

export const primaryIdentityResolvedRequestArray = (
  data: RelationServiceIdentityQueryResponse
) => {
  if (data.data.identity.platform === PlatformType.ethereum) {
    const defaultReturn = {
      identity: data.data.identity.identity,
      platform: PlatformType.ethereum,
      reverse: null,
    };
    const reverseFromNeighbor = data.data.identity.neighbor
      .filter(
        (x) =>
          x.reverse ||
          [PlatformType.farcaster, PlatformType.lens].includes(
            x.identity.platform
          )
      )
      .map((x) => ({
        identity: x.identity.identity,
        platform: x.identity.platform,
        reverse: x.reverse,
      }));
    return [defaultReturn, ...reverseFromNeighbor];
  } else {
    const defaultReturn = {
      identity: data?.data?.identity?.identity,
      platform: data?.data?.identity?.platform,
      reverse: null,
    };
    const reverseFromNeighbor = data?.data?.identity?.neighbor
      .filter(
        (x) =>
          x.reverse ||
          [PlatformType.farcaster, PlatformType.lens].includes(
            x.identity.platform
          ) ||
          (x.identity.platform === PlatformType.ethereum &&
            x.identity.displayName)
      )
      .map((x) => ({
        identity: x.identity.identity,
        platform: x.identity.platform,
        reverse: x.reverse,
      }));
    return [...reverseFromNeighbor, defaultReturn];
  }
};

