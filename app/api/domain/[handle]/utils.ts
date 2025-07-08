import { queryIdentityGraph, QueryType } from "@/utils/query";
import { type AuthHeaders } from "@/utils/types";
import { errorHandle, formatTimestamp, respondWithCache } from "@/utils/utils";
import { type Platform, ErrorMessages } from "web3bio-profile-kit/types";

export const resolveDomainQuery = async (
  handle: string,
  platform: Platform,
  headers: AuthHeaders,
  pathname: string,
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
      platform,
      path: pathname,
      code: 404,
      message: ErrorMessages.NOT_FOUND,
    });
  }

  // Destructure with defaults for cleaner code
  const {
    profile,
    isPrimary,
    status,
    registeredAt,
    updatedAt,
    expiredAt,
    resolver,
    ownerAddress = [],
    resolvedAddress = [],
    managerAddress = [],
  } = identity;

  // Extract addresses with null fallback
  const ownerAddr = ownerAddress[0]?.address ?? null;
  const resolvedAddr = resolvedAddress[0]?.address ?? null;
  const managerAddr = managerAddress[0]?.address ?? null;

  // Build addresses object efficiently
  const addresses =
    profile?.addresses?.reduce(
      (
        acc: Record<string, string>,
        { network, address }: { network: string; address: string },
      ) => {
        acc[network] = address;
        return acc;
      },
      {},
    ) ?? {};

  // Build response object
  const responseData = {
    identity: identity.identity,
    platform: identity.platform,
    resolvedAddress: resolvedAddr,
    ownerAddress: ownerAddr,
    managerAddress: managerAddr,
    resolverAddress: resolver || null,
    displayName: profile?.displayName || null,
    isPrimary,
    status,
    createdAt: formatTimestamp(registeredAt),
    updatedAt: formatTimestamp(updatedAt),
    expiredAt: formatTimestamp(expiredAt),
    contenthash: profile?.contenthash || null,
    texts: profile?.texts ?? {},
    addresses,
  };

  return respondWithCache(responseData);
};
