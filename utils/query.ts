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
    identityGraph(reverse:true) {
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
) => {
  const resolvedRecord = data?.data?.identity;
  const defaultReturn = {
    identity: resolvedRecord.identity,
    platform: resolvedRecord.platform,
    reverse: false,
  };

  if (
    directPass(resolvedRecord) &&
    resolvedRecord.identityGraph.vertices?.length > 0
  ) {
    const resolved = resolvedRecord.identityGraph.vertices
      .filter((x) => directPass(x))
      .map((x) => ({
        identity: x.identity,
        platform: x.platform,
        reverse: x.reverse,
      }));
    return [...resolved];
  }
  return [defaultReturn];
};
