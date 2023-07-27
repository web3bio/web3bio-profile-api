import { PlatformType } from "./platform";

export const getRelationQuery = (platform: PlatformType) => {
  return [PlatformType.ens, PlatformType.lens].includes(platform)
    ? GET_PROFILES_DOMAIN
    : GET_PROFILES_QUERY;
};
const GET_PROFILES_DOMAIN = `
query GET_PROFILES_DOMAIN($platform: String, $identity: String) {
  domain(domainSystem: $platform, name: $identity) {
		source
		system
		name
		fetcher
		resolved {
			identity
			platform
			displayName
      uuid
			neighbor(depth: 3) {
        sources # Which upstreams provide these connection infos.
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

export const GET_PROFILES_QUERY = `
query GET_PROFILES_QUERY($platform: String, $identity: String) {
  identity(platform: $platform, identity: $identity) {
    platform
    identity
    displayName
    uuid
    ownedBy {
      uuid
      platform
      identity
      displayName
    }
    neighbor(depth: 3) {
      sources # Which upstreams provide these connection infos.
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
