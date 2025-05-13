import { PlatformType } from "@/utils/platform";
import { queryIdentityGraph, QueryType } from "@/utils/query";
import { AuthHeaders, ErrorMessages } from "@/utils/types";
import { errorHandle, formatTimestamp, respondWithCache } from "@/utils/utils";

export const resolveDomainQuery = async (
  handle: string,
  platform: PlatformType,
  headers: AuthHeaders,
) => {
  const response = await queryIdentityGraph(
    QueryType.GET_DOMAIN,
    handle,
    platform,
    headers,
  );
  const identity = response?.data?.identity;
  if (!identity) {
    return errorHandle({
      identity: handle,
      platform: platform,
      code: 404,
      message: ErrorMessages.notFound,
    });
  }
  const ownerAddress = identity.ownerAddress[0]?.address || null;
  const resolvedAddress = identity.resolvedAddress[0]?.address || null;
  const managerAddress = identity.managerAddress[0]?.address || null;
  const profile = identity.profile;

  const json = {
    identity: identity.identity,
    platform: identity.platform,
    resolvedAddress: resolvedAddress,
    ownerAddress: ownerAddress,
    managerAddress: managerAddress,
    displayName: profile?.displayName || null,
    isPrimary: identity.isPrimary,
    status: identity.status,
    createdAt: formatTimestamp(identity.registeredAt),
    updatedAt: formatTimestamp(identity.updatedAt),
    expiredAt: formatTimestamp(identity.expiredAt),
    contenthash: profile?.contenthash || null,
    texts: profile?.texts || {},
    addresses: profile?.addresses
      ? profile.addresses.reduce(
          (
            pre: { [index: string]: string },
            { network, address }: { network: string; address: string },
          ) => ({ ...pre, [network]: address }),
          {},
        )
      : {},
  };

  return respondWithCache(JSON.stringify(json));
};
