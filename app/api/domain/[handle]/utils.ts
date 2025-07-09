import { queryIdentityGraph, QueryType } from "@/utils/query";
import { IdentityRecord, type AuthHeaders } from "@/utils/types";
import { errorHandle, formatTimestamp, respondWithCache } from "@/utils/utils";
import { ErrorMessages, Platform } from "web3bio-profile-kit/types";
import { isSameAddress } from "web3bio-profile-kit/utils";

const DOMAIN_PLATFORMS = new Set([Platform.ethereum, Platform.solana]);
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
    ownerAddress,
    resolvedAddress,
    managerAddress,
  } = identity;
  return {
    identity: identity.identity,
    platform: identity.platform,
    resolvedAddress: resolvedAddress?.[0]?.address ?? null,
    ownerAddress: ownerAddress?.[0]?.address ?? null,
    managerAddress: managerAddress?.[0]?.address ?? null,
    resolverAddress: resolver || null,
    displayName: profile?.displayName || null,
    isPrimary,
    status,
    createdAt: registeredAt ? formatTimestamp(registeredAt) : null,
    updatedAt: updatedAt ? formatTimestamp(updatedAt) : null,
    expiredAt: expiredAt ? formatTimestamp(expiredAt) : null,
    contenthash: profile?.contenthash || null,
  };
};

const buildAddressesMap = (
  addresses?: Array<{ network: string; address: string }>,
) => {
  if (!addresses?.length) return {};

  const result: Record<string, string> = {};
  for (const { network, address } of addresses) {
    result[network] = address;
  }
  return result;
};

const buildDomainsArray = (
  vertices: IdentityRecord[],
  handle: string,
  platform: Platform,
) => {
  if (!DOMAIN_PLATFORMS.has(platform) || !vertices?.length) return [];

  const domains: ReturnType<typeof generateResponseStruct>[] = [];

  for (const vertex of vertices) {
    if (
      TARGET_PLATFORMS.has(vertex.platform) &&
      vertex.ownerAddress?.[0]?.address &&
      isSameAddress(vertex.ownerAddress[0].address, handle)
    ) {
      domains.push(generateResponseStruct(vertex));
    }
  }

  return domains;
};

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

  const responseData = generateResponseStruct(identity);
  const { profile, identityGraph } = identity;

  const addresses = buildAddressesMap(profile?.addresses);
  const domains = buildDomainsArray(identityGraph?.vertices, handle, platform);

  return respondWithCache({
    ...responseData,
    texts: profile?.texts,
    addresses,
    domains,
  });
};
