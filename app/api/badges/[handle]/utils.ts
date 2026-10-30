import { ErrorMessages, Platform } from "web3bio-profile-kit/types";
import { QueryType, queryIdentityGraph } from "@/utils/query";
import type { AuthHeaders } from "@/utils/types";
import { errorHandle, respondJson } from "@/utils/utils";

export const resolveBadgesHandle = async (
  identity: string,
  platform: Platform,
  headers: AuthHeaders,
  pathname: string,
) => {
  try {
    const res = await queryIdentityGraph(
      QueryType.GET_BADGES_QUERY,
      identity,
      platform,
      headers,
    );
    const badges = res.data?.identity?.badges;

    if (res.errors || !Array.isArray(badges)) {
      return errorHandle({
        identity,
        platform,
        path: pathname,
        code: 404,
        message: ErrorMessages.NOT_FOUND,
      });
    }

    return respondJson(
      badges.map(
        (badge: {
          badgeId: string;
          network: string;
          claimTxhash: string | null;
        }) => {
          const tokenId = badge.badgeId.match(/-(\d+)$/)?.[1];
          const badgeUrl =
            badge.network === "ethereum" && badge.claimTxhash
              ? `https://etherscan.io/tx/${badge.claimTxhash}`
              : badge.network === "lens" && tokenId
                ? `https://explorer.lens.xyz/token/0x81A028cb73D88e54f8C148Eb08861572d09B808B/instance/${tokenId}`
                : null;
          return { ...badge, badgeUrl };
        },
      ),
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
