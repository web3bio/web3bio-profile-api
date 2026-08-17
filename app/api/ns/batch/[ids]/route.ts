import type { NextRequest } from "next/server";
import { ErrorMessages } from "web3bio-profile-kit/types";
import { errorHandle, getUserHeaders, respondJson } from "@/utils/utils";
import { queryIdentityGraphBatch } from "@/utils/query";
import {
  invalidBatchIdentityResponse,
  parseIdsParam,
} from "@/utils/utils";

type RouteParams = {
  params: Promise<{
    ids: string;
  }>;
};

export async function GET(req: NextRequest, { params }: RouteParams) {
  const { ids: idsParam } = await params;
  const { pathname } = req.nextUrl;

  if (!idsParam) {
    return invalidBatchIdentityResponse(pathname, "", 400);
  }

  const headers = getUserHeaders(req.headers);

  try {
    const ids = parseIdsParam(idsParam);
    if (!ids) {
      return invalidBatchIdentityResponse(pathname, idsParam, 400);
    }

    const resJson = await queryIdentityGraphBatch(ids, true, headers);
    return respondJson(resJson);
  } catch (e: unknown) {
    const isParseError = e instanceof SyntaxError;

    return errorHandle({
      identity: idsParam,
      path: pathname,
      platform: null,
      code: isParseError ? 400 : 404,
      message: e instanceof Error ? e.message : ErrorMessages.INVALID_IDENTITY,
    });
  }
}
