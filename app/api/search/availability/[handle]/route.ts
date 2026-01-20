import { getQuery, QueryType } from "@/utils/query";
import { AuthHeaders } from "@/utils/types";
import {
  errorHandle,
  getUserHeaders,
  IDENTITY_GRAPH_SERVER,
  respondJson,
} from "@/utils/utils";
import type { NextRequest } from "next/server";
import { ErrorMessages } from "web3bio-profile-kit/types";

interface DomainAvailabilityResponse {
  platform: string;
  name: string;
  expiredAt: string | null;
  availability: boolean;
  status: string;
}

interface GraphQLResponse {
  data?: {
    domainAvailableSearch: DomainAvailabilityResponse[];
  };
  errors?: unknown;
  code?: number;
  msg?: string;
}

const queryDomains = async (
  handle: string,
  headers: AuthHeaders,
): Promise<GraphQLResponse> => {
  const response = await fetch(IDENTITY_GRAPH_SERVER, {
    method: "POST",
    headers: {
      ...headers,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query: getQuery(QueryType.GET_AVAILABLE_DOMAINS),
      variables: { name: handle },
    }),
  });
  if (!response.ok) {
    throw new Error(`GraphQL request failed: ${response.status}`);
  }

  return response.json();
};

export async function GET(
  req: NextRequest,
  props: { params: Promise<{ handle: string }> },
): Promise<Response> {
  const { pathname } = req.nextUrl;
  const { handle } = await props.params;

  if (!handle || typeof handle !== "string" || handle.trim().length === 0) {
    return errorHandle({
      identity: null,
      path: pathname,
      platform: null,
      message: ErrorMessages.INVALID_IDENTITY,
      code: 400,
    });
  }

  const trimmedHandle = handle.trim();
  const headers = getUserHeaders(req.headers);
  try {
    const result = await queryDomains(trimmedHandle, headers);

    if (result.errors || result.code) {
      return errorHandle({
        identity: trimmedHandle,
        platform: null,
        path: pathname,
        message: result.errors
          ? "GraphQL query failed"
          : result.msg || ErrorMessages.NOT_FOUND,
        code: result.code || 500,
      });
    }

    return respondJson(result);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";

    return errorHandle({
      identity: trimmedHandle,
      platform: null,
      path: pathname,
      message: errorMessage,
      code: 500,
    });
  }
}
