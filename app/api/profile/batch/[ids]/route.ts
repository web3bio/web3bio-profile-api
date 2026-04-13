import type { NextRequest } from "next/server";
import { ErrorMessages } from "web3bio-profile-kit/types";
import { errorHandle, getUserHeaders, respondJson } from "@/utils/utils";
import { queryIdentityGraphBatch } from "@/utils/query";

const parseIdsParam = (idsParam: string): string[] | null => {
  const ids = JSON.parse(decodeURIComponent(idsParam));
  return Array.isArray(ids) ? ids : null;
};

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ ids: string }> },
) {
  const { ids: idsParam } = await params;
  const { pathname } = req.nextUrl;

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
    const ids = parseIdsParam(idsParam);
    if (!ids) {
      return errorHandle({
        identity: idsParam,
        path: pathname,
        platform: null,
        code: 400,
        message: ErrorMessages.INVALID_IDENTITY,
      });
    }

    const resJson = await queryIdentityGraphBatch(ids, false, headers);
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
