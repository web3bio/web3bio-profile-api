import { ErrorMessages, Platform } from "web3bio-profile-kit/types";
import { getNetwork, isSameAddress } from "web3bio-profile-kit/utils";
import { QueryType, queryIdentityGraph } from "@/utils/query";
import type { AuthHeaders } from "@/utils/types";
import { errorHandle, respondJson } from "@/utils/utils";

type BadgeRecord = {
  badgeId?: string;
  network: string;
  address?: string | null;
  claimTxhash?: string | null;
};

type BadgeVertex = {
  id?: string;
  platform?: string;
  badges?: BadgeRecord[] | null;
};

type BadgeIdentity = {
  profile?: { address?: string | null } | null;
  badges?: BadgeRecord[] | null;
  identityGraph?: { vertices?: BadgeVertex[] | null } | null;
};

export const badgeExplorerUrl = (badge: {
  network: string;
  claimTxhash?: string | null;
}): string | null => {
  const prefix = getNetwork(badge.network)?.scanPrefixTx;
  if (!prefix || !badge.claimTxhash) return null;
  return `${prefix}${badge.claimTxhash}`;
};

const filterRelatedVertices = (
  vertices: BadgeVertex[],
  queryId: string,
  address: string,
): BadgeVertex[] =>
  vertices.filter((vertex) => {
    if (vertex.id === queryId) return true;
    if (!address) return false;

    const [, vertexIdentity] = vertex.id?.split(",") ?? [];
    return vertexIdentity ? isSameAddress(address, vertexIdentity) : false;
  });

const badgeKey = (badge: BadgeRecord) =>
  [badge.badgeId, badge.network, badge.address, badge.claimTxhash].join("\0");

export const collectBadges = (
  identity: string,
  platform: Platform,
  record: BadgeIdentity,
): BadgeRecord[] | null => {
  const queryId = `${platform},${identity}`;
  const address = record.profile?.address || "";
  const vertices = filterRelatedVertices(
    record.identityGraph?.vertices || [],
    queryId,
    address,
  );
  const collected = [
    ...(Array.isArray(record.badges) ? record.badges : []),
    ...vertices.flatMap((vertex) =>
      Array.isArray(vertex.badges) ? vertex.badges : [],
    ),
  ];

  if (!collected.length && !Array.isArray(record.badges)) return null;

  const seen = new Set<string>();
  return collected.filter((badge) => {
    const key = badgeKey(badge);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

export const resolveBadgesHandle = async (
  identity: string,
  platform: Platform,
  headers: AuthHeaders,
  pathname: string,
) => {
  const notFound = () =>
    errorHandle({
      identity,
      platform,
      path: pathname,
      code: 404,
      message: ErrorMessages.NOT_FOUND,
    });

  try {
    const res = await queryIdentityGraph(
      QueryType.GET_BADGES_QUERY,
      identity,
      platform,
      headers,
    );
    const record = res.data?.identity as BadgeIdentity | null | undefined;

    if (!record) {
      return errorHandle({
        identity,
        platform,
        path: pathname,
        code: res.errors ? (res.code ?? 500) : 404,
        message: res.errors
          ? ErrorMessages.NETWORK_ERROR
          : ErrorMessages.NOT_FOUND,
      });
    }

    const badges = collectBadges(identity, platform, record);
    if (!badges) return notFound();

    return respondJson(
      badges.map((badge) => ({
        ...badge,
        badgeUrl: badgeExplorerUrl(badge),
      })),
      platform,
    );
  } catch {
    return errorHandle({
      identity,
      platform,
      path: pathname,
      code: 500,
      message: ErrorMessages.NETWORK_ERROR,
    });
  }
};
