import type { NextRequest } from "next/server";
import { ErrorMessages, Platform } from "web3bio-profile-kit/types";
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
import { parseInteger } from "../../../utils";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ targetPlatform: string; handle: string }> },
) {
  const { targetPlatform, handle } = await params;
  const { pathname, searchParams } = req.nextUrl;
  const match = /^(farcaster|lens),([^,\s]+)$/.exec(handle);
  if (!match || !["lens", "farcaster"].includes(targetPlatform) || match[1] === targetPlatform) {
    return invalidIdentityResponse(pathname, handle, null, 400);
  }
  const platform = match[1] as Platform;
  const identity = match[2];
  const fail = (code: number, message: string) =>
    errorHandle({ identity, path: pathname, platform, code, message });

  const page = parseInteger(searchParams.get("page"), 0);
  const limit = parseInteger(searchParams.get("limit"), 200);
  if (!Number.isSafeInteger(page) || page < 0 ||
      !Number.isSafeInteger(limit) || limit < 1 || limit > 200) {
    return fail(400, "Invalid pagination");
  }

  try {
    const { ok, status, body } = await postIdentityGraphQuery(
      getUserHeaders(req.headers),
      getQuery(QueryType.GET_FOLLOWING_ASSOCIATED_ACCOUNTS),
      { sourcePlatform: platform, sourceIdentity: identity, targetPlatform, page, totalPage: limit },
    );
    const envelope = body as {
      code?: number;
      errors?: unknown;
      data?: { searchFollowingAssociatedAccounts?: { queryId?: string; following?: unknown[] } | null };
    } | null;
    if (!ok || envelope?.code || envelope?.errors) {
      return fail(
        identityGraphErrorStatus(ok, status, envelope?.code),
        identityGraphErrorMessage(envelope, ErrorMessages.NOT_FOUND),
      );
    }

    const result = envelope?.data?.searchFollowingAssociatedAccounts;
    if (result === null) return fail(404, ErrorMessages.NOT_FOUND);
    if (typeof result?.queryId !== "string" || !Array.isArray(result?.following)) {
      return fail(502, ErrorMessages.NETWORK_ERROR);
    }
    return respondJson(result, platform);
  } catch (error: unknown) {
    return fail(
      error instanceof Error ? Number(error.cause) || 500 : 500,
      error instanceof Error ? error.message : ErrorMessages.NETWORK_ERROR,
    );
  }
}
