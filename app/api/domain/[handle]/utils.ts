import type { IdentityRecord, AuthHeaders } from "@/utils/types";
import { queryIdentityGraph, QueryType } from "@/utils/query";
import { errorHandle, formatTimestamp, respondWithCache } from "@/utils/utils";
import { ErrorMessages, Platform } from "web3bio-profile-kit/types";
import { isSameAddress } from "web3bio-profile-kit/utils";

export const VALID_DOMAIN_PLATFORMS = new Set([
  Platform.ens,
  Platform.ethereum,
  Platform.sns,
  Platform.solana,
  Platform.basenames,
  Platform.linea,
]);
const EXTEND_DOMAIN_PLATFORMS = new Set([Platform.ethereum, Platform.solana]);
const TARGET_PLATFORMS = new Set([Platform.ens, Platform.sns]);

const generateResponseStruct = (identity: IdentityRecord) => {
  const {
    profile,
    isPrimary,
    status,
    registeredAt,
    updatedAt,
    expiredAt,
    resolver,
  } = identity;

  return {
    identity: identity.identity,
    platform: identity.platform,
    resolvedAddress: identity.resolvedAddress?.[0]?.address ?? null,
    ownerAddress: identity.ownerAddress?.[0]?.address ?? null,
    managerAddress: identity.managerAddress?.[0]?.address ?? null,
    resolverAddress: resolver ?? null,
    isPrimary,
    status,
    createdAt: registeredAt ? formatTimestamp(registeredAt) : null,
    updatedAt: updatedAt ? formatTimestamp(updatedAt) : null,
    expiredAt: expiredAt ? formatTimestamp(expiredAt) : null,
    contenthash: profile?.contenthash ?? null,
  };
};

const buildAddressesMap = (
  addresses?: Array<{ network: string; address: string }>,
): Record<string, string> => {
  if (!addresses?.length) return {};
  return Object.fromEntries(addresses.map(({ network, address }) => [network, address]));
};

const buildDomainsArray = (
  vertices: IdentityRecord[] = [],
  handle: string,
): ReturnType<typeof generateResponseStruct>[] => {
  if (!vertices.length) return [];
  return vertices
    .filter(vertex => {
      const ownerAddr = vertex.ownerAddress?.[0]?.address;
      return TARGET_PLATFORMS.has(vertex.platform) && ownerAddr && isSameAddress(ownerAddr, handle);
    })
    .map(generateResponseStruct);
};

export const resolveDomainQuery = async (
  handle: string,
  platform: Platform,
  headers: AuthHeaders,
  pathname: string,
) => {
  const response = await queryIdentityGraph(
    EXTEND_DOMAIN_PLATFORMS.has(platform)
      ? QueryType.GET_DOMAIN
      : QueryType.GET_DOMAIN_SINGLE,
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

  const responseData = generateResponseStruct(identity);
  const { profile, identityGraph } = identity;
  const addresses = buildAddressesMap(profile?.addresses);

  return respondWithCache(
    {
      ...responseData,
      texts: profile?.texts ?? null,
      addresses,
      domains: buildDomainsArray(identityGraph?.vertices || [], handle),
    },
    true,
  );
};
