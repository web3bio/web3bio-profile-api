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

const parseInteger = (value: string | null, fallback: number) =>
  value === null ? fallback : /^\d+$/.test(value) ? Number(value) : NaN;

export async function getSocialGraph(req: NextRequest, handle: string) {
  const { pathname, searchParams } = req.nextUrl;
  const match = /^(farcaster|lens),([^,\s]+)$/.exec(handle);
  if (!match) return invalidIdentityResponse(pathname, handle, null, 400);
  const platform = match[1] as Platform;
  const identity = match[2];
  const fail = (code: number, message: string) =>
    errorHandle({ identity, path: pathname, platform, code, message });

  const page = parseInteger(searchParams.get("page"), 0);
  const limit = parseInteger(searchParams.get("limit"), 50);
  if (!Number.isSafeInteger(page) || page < 0 ||
      !Number.isSafeInteger(limit) || limit < 1 || limit > 200) {
    return fail(400, "Invalid pagination");
  }

  try {
    const { ok, status, body } = await postIdentityGraphQuery(
      getUserHeaders(req.headers),
      getQuery(QueryType.GET_SOCIAL_GRAPH),
      { sourceId: handle, recommendPlatform: platform, page, totalPage: limit },
    );
    const envelope = body as {
      code?: number;
      errors?: unknown;
      data?: { socialGraphCrossPlatformRecommendation?: { source?: unknown } | null };
    } | null;
    if (!ok || envelope?.code || envelope?.errors) {
      return fail(
        identityGraphErrorStatus(ok, status, envelope?.code),
        identityGraphErrorMessage(envelope, ErrorMessages.NOT_FOUND),
      );
    }

    const socialGraph = envelope?.data?.socialGraphCrossPlatformRecommendation;
    if (!socialGraph?.source) return fail(404, ErrorMessages.NOT_FOUND);
    return respondJson(socialGraph, platform);
  } catch (error: unknown) {
    return fail(
      error instanceof Error ? Number(error.cause) || 500 : 500,
      error instanceof Error ? error.message : ErrorMessages.NOT_FOUND,
    );
  }
}
