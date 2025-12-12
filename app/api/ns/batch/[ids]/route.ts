import type { NextRequest } from "next/server";
import { ErrorMessages } from "web3bio-profile-kit/types";
import { errorHandle, getUserHeaders, respondJson } from "@/utils/utils";
import { queryIdentityGraphBatch } from "@/utils/query";

type RouteParams = {
  params: Promise<{
    ids: string;
  }>;
};

export async function GET(req: NextRequest, { params }: RouteParams) {
  const { ids: idsParam } = await params;
  const { pathname } = req.nextUrl;

  // Early validation for missing ids parameter
  if (!idsParam) {
    return errorHandle({
      identity: "",
      path: pathname,
      platform: null,
      code: 400,
      message: ErrorMessages.INVALID_IDENTITY,
    });
  }

  const headers = getUserHeaders(req.headers);

  try {
    // Decode URL-encoded JSON
    const decodedIds = decodeURIComponent(idsParam);
    const ids = JSON.parse(decodedIds);

    // Validate that ids is an array
    if (!Array.isArray(ids)) {
      return errorHandle({
        identity: idsParam,
        path: pathname,
        platform: null,
        code: 400,
        message: ErrorMessages.INVALID_IDENTITY,
      });
    }

    const resJson = await queryIdentityGraphBatch(ids, true, headers);
    return respondJson(resJson);
  } catch (e: unknown) {
    // More specific error handling for JSON parsing vs other errors
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
