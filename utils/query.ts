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
    reverseDomains{
      source
      system
      name
      reverse
    }
  }
}
`;

export const primaryDomainsResolvedRequestArray = (
  data: RelationServiceDomainQueryResponse
) => {
  if (data.data.domain.reverse) {
    return supportedPlatforms.map((x) => ({
      identity: data.data.domain.resolved.identity,
      platform: x,
    }));
  }
  return [
    {
      identity: data.data.domain.name,
      platform: data.data.domain.system,
    },
  ];
};

export const primaryETHResolvedRequestArray = (
  data: RelationServiceIdentityQueryResponse
) => {
  return (
    data.data.identity?.reverseDomains
      .filter((x) => !!x.reverse)
      .map((x) => ({
        identity: x.name,
        platform: x.system,
      })) || [
      {
        identity: data.data.identity.identity,
        platform: data.data.identity.platform,
      },
    ]
  );
};
