import type { NextRequest } from "next/server";
import { ErrorMessages } from "web3bio-profile-kit/types";
import {
  getQuery,
  identityGraphErrorMessage,
  identityGraphErrorStatus,
  postIdentityGraphQuery,
  QueryType,
} from "@/utils/query";
import { errorHandle, getUserHeaders, respondJson } from "@/utils/utils";

interface GraphQLEnvelope {
  data?: unknown;
  errors?: unknown;
  code?: number;
  msg?: string;
}

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
    const { ok, status, body } = await postIdentityGraphQuery(
      headers,
      getQuery(QueryType.GET_AVAILABLE_DOMAINS),
      { name: handle },
    );

    const result = body as GraphQLEnvelope | null;

    if (!ok || !result || result.code || result.errors) {
      return errorHandle({
        identity: handle,
        platform: null,
        path: pathname,
        message: identityGraphErrorMessage(result, ErrorMessages.NOT_FOUND),
        code: identityGraphErrorStatus(ok, status, result?.code),
      });
    }

    return respondJson(result);
  } catch (e: unknown) {
    return errorHandle({
      identity: handle,
      platform: null,
      path: pathname,
      message: e instanceof Error ? e.message : ErrorMessages.NOT_FOUND,
      code: e instanceof Error ? Number(e.cause) || 500 : 500,
    });
  }
}
