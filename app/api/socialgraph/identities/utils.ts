import type { NextRequest } from "next/server";
import { ErrorMessages, Platform } from "web3bio-profile-kit/types";
import {
  getQuery,
  postIdentityGraphQuery,
  QueryType,
} from "@/utils/query";
import { errorHandle, getErrorCauseCode, getUserHeaders, respondJson } from "@/utils/utils";

export async function lookupAssociatedAccounts(
  req: NextRequest,
  queryIds: unknown,
  single = false,
) {
  const fail = (code: number, message: string) =>
    errorHandle({
      identity: single && Array.isArray(queryIds) ? queryIds[0] : "",
      path: req.nextUrl.pathname,
      platform: null,
      code,
      message,
    });

  if (
    !Array.isArray(queryIds) || !queryIds.length || queryIds.length > 200 ||
    !queryIds.every((id) =>
      typeof id === "string" && /^(lens|farcaster),[^,\s]+$/.test(id)
    )
  ) {
    return fail(400, "Expected 1 to 200 Lens or Farcaster queryIds");
  }

  try {
    const { data } = await postIdentityGraphQuery<{
      batchAssociatedAccountsLookup?: unknown[] | null;
    }>(
      getUserHeaders(req.headers),
      getQuery(QueryType.GET_ASSOCIATED_ACCOUNTS),
      { queryIds },
    );
    const results = data.batchAssociatedAccountsLookup;
    if (!Array.isArray(results)) return fail(502, ErrorMessages.NETWORK_ERROR);
    if (single && !results.length) return fail(404, ErrorMessages.NOT_FOUND);
    return respondJson(
      single ? results[0] : results,
      single ? queryIds[0].split(",")[0] as Platform : undefined,
    );
  } catch (error: unknown) {
    return fail(
      getErrorCauseCode(error),
      error instanceof Error ? error.message : ErrorMessages.NETWORK_ERROR,
    );
  }
}
