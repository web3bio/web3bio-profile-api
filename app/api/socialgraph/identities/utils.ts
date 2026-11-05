import type { NextRequest } from "next/server";
import { ErrorMessages, Platform } from "web3bio-profile-kit/types";
import {
  getQuery,
  identityGraphErrorMessage,
  identityGraphErrorStatus,
  postIdentityGraphQuery,
  QueryType,
} from "@/utils/query";
import { errorHandle, getUserHeaders, respondJson } from "@/utils/utils";

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
    const { ok, status, body } = await postIdentityGraphQuery(
      getUserHeaders(req.headers),
      getQuery(QueryType.GET_ASSOCIATED_ACCOUNTS),
      { queryIds },
    );
    const envelope = body as {
      code?: number;
      errors?: unknown;
      data?: { batchAssociatedAccountsLookup?: unknown[] | null };
    } | null;
    if (!ok || envelope?.code || envelope?.errors) {
      return fail(
        identityGraphErrorStatus(ok, status, envelope?.code),
        identityGraphErrorMessage(envelope, ErrorMessages.NOT_FOUND),
      );
    }

    const results = envelope?.data?.batchAssociatedAccountsLookup;
    if (!Array.isArray(results)) return fail(502, ErrorMessages.NETWORK_ERROR);
    if (single && !results.length) return fail(404, ErrorMessages.NOT_FOUND);
    return respondJson(
      single ? results[0] : results,
      single ? queryIds[0].split(",")[0] as Platform : undefined,
    );
  } catch (error: unknown) {
    return fail(
      error instanceof Error ? Number(error.cause) || 500 : 500,
      error instanceof Error ? error.message : ErrorMessages.NETWORK_ERROR,
    );
  }
}
