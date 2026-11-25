import type { NextRequest } from "next/server";
import { ErrorMessages, Platform } from "web3bio-profile-kit/types";
import { isValidEthereumAddress, REGEX } from "web3bio-profile-kit/utils";
import {
  getQuery,
  identityGraphErrorMessage,
  identityGraphErrorStatus,
  postIdentityGraphQuery,
  QueryType,
} from "@/utils/query";
import {
  errorHandle,
  getUserHeaders,
  invalidIdentityResponse,
  respondJson,
} from "@/utils/utils";
import { parseInteger } from "../utils";

type BestiesPage = {
  queryId?: string;
  profile: Record<string, unknown> | null;
  pagination: { total: number; hasMore: boolean; page: number; limit: number } | null;
  besties: {
    queryId?: string;
    profile: Record<string, unknown> | null;
    score?: Record<string, unknown> | null;
    associatedAccounts: Record<string, unknown>[] | null;
  }[];
};

export async function getBestiesAssociatedAccounts(
  req: NextRequest,
  handle: string,
  { flat = false } = {},
) {
  const { pathname, searchParams } = req.nextUrl;
  const identity = /^(?:farcaster,)?([^,\s]+)$/.exec(handle)?.[1];
  if (
    !identity ||
    isValidEthereumAddress(identity) ||
    !(REGEX.FARCASTER.test(identity) || /^#\d+$/.test(identity))
  ) {
    return invalidIdentityResponse(pathname, handle, null, 400);
  }

  const platform = Platform.farcaster;
  const fail = (code: number, message: string) =>
    errorHandle({ identity, path: pathname, platform, code, message });

  const page = parseInteger(searchParams.get("page"), 0);
  const limit = parseInteger(searchParams.get("limit"), 100);
  if (
    !Number.isSafeInteger(page) || page < 0 ||
    !Number.isSafeInteger(limit) || limit < 1 || limit > 200
  ) {
    return fail(400, "Invalid pagination");
  }

  try {
    const { ok, status, body } = await postIdentityGraphQuery(
      getUserHeaders(req.headers),
      getQuery(QueryType.GET_BESTIES_ASSOCIATED_ACCOUNTS),
      { sourceIdentity: identity, page, totalPage: limit, includeDetails: flat },
    );
    const envelope = body as {
      code?: number;
      errors?: unknown;
      data?: { searchBestiesAssociatedAccounts?: BestiesPage | null };
    } | null;
    if (!ok || envelope?.code || envelope?.errors) {
      return fail(
        identityGraphErrorStatus(ok, status, envelope?.code),
        identityGraphErrorMessage(envelope, ErrorMessages.NOT_FOUND),
      );
    }

    const result = envelope?.data?.searchBestiesAssociatedAccounts;
    if (result === null) return fail(404, ErrorMessages.NOT_FOUND);
    if (!Array.isArray(result?.besties)) {
      return fail(502, ErrorMessages.NETWORK_ERROR);
    }
    if (!flat) return respondJson(result, platform);
    return respondJson({
      queryId: result.queryId,
      ...result.profile,
      ...result.pagination,
      besties: result.besties.map(({ queryId, profile, score, associatedAccounts }) => ({
        queryId, ...profile, ...score, associatedAccounts: associatedAccounts ?? [],
      })),
    }, platform);
  } catch (error: unknown) {
    return fail(
      error instanceof Error ? Number(error.cause) || 500 : 500,
      error instanceof Error ? error.message : ErrorMessages.NETWORK_ERROR,
    );
  }
}
