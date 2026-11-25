import type { NextRequest } from "next/server";
import { ErrorMessages, Platform } from "web3bio-profile-kit/types";
import {
  getQuery,
  postIdentityGraphQuery,
  QueryType,
} from "@/utils/query";
import {
  errorHandle,
  getErrorCauseCode,
  getUserHeaders,
  invalidIdentityResponse,
  respondJson,
} from "@/utils/utils";

export const parseInteger = (value: string | null, fallback: number) =>
  value === null ? fallback : /^\d+$/.test(value) ? Number(value) : NaN;

export async function getSocialGraph(req: NextRequest, handle: string) {
  const { pathname, searchParams } = req.nextUrl;
  handle = handle.replace(/^[^,]+/, (prefix) => prefix.toLowerCase());
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
    const { data } = await postIdentityGraphQuery<{
      socialGraphCrossPlatformRecommendation?: { source?: unknown } | null;
    }>(
      getUserHeaders(req.headers),
      getQuery(QueryType.GET_SOCIAL_GRAPH),
      { sourceId: handle, recommendPlatform: platform, page, totalPage: limit },
    );
    const socialGraph = data.socialGraphCrossPlatformRecommendation;
    if (socialGraph === null || socialGraph?.source === null) return fail(404, ErrorMessages.NOT_FOUND);
    if (!socialGraph?.source) return fail(502, ErrorMessages.NETWORK_ERROR);
    return respondJson(socialGraph, platform);
  } catch (error: unknown) {
    return fail(
      getErrorCauseCode(error),
      error instanceof Error ? error.message : ErrorMessages.NOT_FOUND,
    );
  }
}
