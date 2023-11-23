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
    reverseRecords{
      source
      system
      name
      reverse
    }
    neighbor(depth: 5) {
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

export const primaryDomainResolvedRequestArray = (
  data: RelationServiceDomainQueryResponse,
  handle: string,
  platform: PlatformType
) => {
  console.log(data,'relation service domain')
  if (data?.data?.domain?.reverse) {
    return supportedPlatforms.map((x) => ({
      identity: handle,
      platform: x,
    }));
  }
  return [
    {
      identity: handle,
      platform: platform,
    },
  ];
};

export const primaryIdentityResolvedRequestArray = (
  data: RelationServiceIdentityQueryResponse
) => {
  if (
    [PlatformType.farcaster, PlatformType.nextid].includes(
      data?.data?.identity?.platform as PlatformType
    )
  ) {
    const neighborArray =
      data?.data?.identity?.neighbor.map((x) => ({
        identity: x.identity.identity,
        platform:
          x.identity.platform === PlatformType.ethereum
            ? PlatformType.ens
            : x.identity.platform,
      })) || [];
    return [
      {
        identity: data?.data?.identity?.identity,
        platform: data?.data?.identity?.platform,
      },
      ...neighborArray,
    ];
  }
  return (
    [
      ...data?.data?.identity?.reverseRecords
        .filter((x) => !!x.reverse)
        .map((x) => ({
          identity: x.name,
          platform: x.system,
        })),
      {
        identity: data?.data?.identity?.identity,
        platform: PlatformType.farcaster,
      },
    ] || [
      {
        identity: data?.data?.identity?.identity,
        platform: data?.data?.identity?.platform,
      },
    ]
  );
};
