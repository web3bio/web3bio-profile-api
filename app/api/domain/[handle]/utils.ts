import { queryIdentityGraph, QueryType } from "@/utils/query";
import { type AuthHeaders } from "@/utils/types";
import { errorHandle, formatTimestamp, respondWithCache } from "@/utils/utils";
import { type Platform, ErrorMessages } from "web3bio-profile-kit/types";

export const resolveDomainQuery = async (
  handle: string,
  platform: Platform,
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
      message: ErrorMessages.NOT_FOUND,
    });
  }
  const { profile, isPrimary, status, registeredAt, updatedAt, expiredAt } =
    identity;

  const ownerAddress = identity.ownerAddress[0]?.address ?? null;
  const resolvedAddress = identity.resolvedAddress[0]?.address ?? null;
  const managerAddress = identity.managerAddress[0]?.address ?? null;

  const addresses = profile?.addresses
    ? Object.fromEntries(
        profile.addresses.map(
          ({ network, address }: { network: string; address: string }) => [
            network,
            address,
          ],
        ),
      )
    : {};

  const json = {
    identity: identity.identity,
    platform: identity.platform,
    resolvedAddress,
    ownerAddress,
    managerAddress,
    displayName: profile?.displayName ?? null,
    isPrimary,
    status,
    createdAt: formatTimestamp(registeredAt),
    updatedAt: formatTimestamp(updatedAt),
    expiredAt: formatTimestamp(expiredAt),
    contenthash: profile?.contenthash ?? null,
    texts: profile?.texts ?? {},
    addresses,
  };

  return respondWithCache(JSON.stringify(json));
};
