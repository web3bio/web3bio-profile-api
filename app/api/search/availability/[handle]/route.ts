import type { NextRequest } from "next/server";
import { ErrorMessages, Platform } from "web3bio-profile-kit/types";
import {
  getQuery,
  postIdentityGraphQuery,
  QueryType,
} from "@/utils/query";
import { errorHandle, getErrorCauseCode, getUserHeaders, respondJson } from "@/utils/utils";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ handle: string }> },
) {
  const { pathname } = req.nextUrl;
  const handle = (await params).handle?.trim() ?? "";

  if (!handle) {
    return errorHandle({
      identity: null,
      path: pathname,
      platform: null,
      message: ErrorMessages.INVALID_IDENTITY,
      code: 400,
    });
  }

  const headers = getUserHeaders(req.headers);

  try {
    const result = await postIdentityGraphQuery<{ domainAvailableSearch?: { platform: Platform }[] }>(
      headers,
      getQuery(QueryType.GET_AVAILABLE_DOMAINS),
      { name: handle },
    );

    const domains = result.data.domainAvailableSearch;
    if (!Array.isArray(domains)) throw new Error("Invalid Identity Graph response");
    domains.sort((a, b) => {
      if (a.platform === Platform.lens && b.platform === Platform.farcaster) {
        return -1;
      }
      if (a.platform === Platform.farcaster && b.platform === Platform.lens) {
        return 1;
      }
      return 0;
    });

    return respondJson(result);
  } catch (e: unknown) {
    return errorHandle({
      identity: handle,
      platform: null,
      path: pathname,
      message: e instanceof Error ? e.message : ErrorMessages.NOT_FOUND,
      code: getErrorCauseCode(e),
    });
  }
}
