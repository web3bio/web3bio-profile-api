import type { IdentityRecord, AuthHeaders } from "@/utils/types";
import { queryIdentityGraph, QueryType } from "@/utils/query";
import { errorHandle, formatTimestamp, respondJson } from "@/utils/utils";
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

const formatAddress = (addr?: Array<{ address: string }>) =>
  addr?.[0]?.address ?? null;

const getFirstTxAt = (
  identity: IdentityRecord,
  vertices?: IdentityRecord[],
): string | null => {
  if (EXTEND_DOMAIN_PLATFORMS.has(identity.platform)) {
    return identity.registeredAt
      ? formatTimestamp(identity.registeredAt)
      : null;
  }

  const resolvedAddress = formatAddress(identity.resolvedAddress);
  if (!resolvedAddress || !vertices?.length) {
    return null;
  }

  const resolvedAddressRecord = vertices.find((v) => {
    if (!EXTEND_DOMAIN_PLATFORMS.has(v.platform)) {
      return false;
    }

    return (
      isSameAddress(v.identity, resolvedAddress) ||
      isSameAddress(formatAddress(v.resolvedAddress) || "", resolvedAddress)
    );
  });

  return resolvedAddressRecord?.registeredAt
    ? formatTimestamp(resolvedAddressRecord.registeredAt)
    : null;
};

const generateResponseStruct = (
  identity: IdentityRecord,
  vertices?: IdentityRecord[],
) => ({
  identity: identity.identity,
  platform: identity.platform,
  resolvedAddress: formatAddress(identity.resolvedAddress),
  ownerAddress: formatAddress(identity.ownerAddress),
  managerAddress: formatAddress(identity.managerAddress),
  resolverAddress: identity.resolver ?? null,
  isPrimary: identity.isPrimary,
  status: identity.status,
  createdAt: identity.registeredAt
    ? formatTimestamp(identity.registeredAt)
    : null,
  firstTxAt: getFirstTxAt(identity, vertices),
  updatedAt: identity.updatedAt ? formatTimestamp(identity.updatedAt) : null,
  expiredAt: identity.expiredAt ? formatTimestamp(identity.expiredAt) : null,
  contenthash: identity.profile?.contenthash ?? null,
});

const buildAddressesMap = (
  addresses?: Array<{ network: string; address: string }> | null,
) =>
  Object.fromEntries(
    addresses?.map(({ network, address }) => [network, address]) ?? [],
  );

const buildDomainsArray = (vertices?: IdentityRecord[], handle?: string) =>
  vertices
    ?.filter(
      (v) =>
        TARGET_PLATFORMS.has(v.platform) &&
        !!v.ownerAddress?.[0]?.address &&
        isSameAddress(v.ownerAddress[0].address, handle || ""),
    )
    .map((v) => generateResponseStruct(v, vertices)) ?? [];

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

  const { profile, identityGraph } = identity;

  return respondJson({
    ...generateResponseStruct(identity, identityGraph?.vertices),
    texts: profile?.texts ?? null,
    addresses: buildAddressesMap(profile?.addresses),
    domains: buildDomainsArray(identityGraph?.vertices, handle),
  });
};
