import { GET_AVAILABLE_DOMAINS } from "@/utils/query";
import { type AuthHeaders } from "@/utils/types";
import {
  IDENTITY_GRAPH_SERVER,
  errorHandle,
  getUserHeaders,
  respondWithCache,
} from "@/utils/utils";
import type { NextRequest } from "next/server";
import { ErrorMessages } from "web3bio-profile-kit/types";

interface DomainAvailabilityParams {
  params: {
    handle: string;
  };
}

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
      query: GET_AVAILABLE_DOMAINS,
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
  { params }: DomainAvailabilityParams,
): Promise<Response> {
  const headers = getUserHeaders(req.headers);
  const { pathname } = req.nextUrl;
  const handle = params.handle;

  // Validate handle parameter
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

  try {
    const result = await queryDomains(trimmedHandle, headers);

    // Handle GraphQL errors
    if (result.errors) {
      return errorHandle({
        identity: trimmedHandle,
        platform: null,
        path: pathname,
        message: "GraphQL query failed",
        code: 500,
      });
    }

    // Handle API-level errors
    if (result.code) {
      return errorHandle({
        identity: trimmedHandle,
        platform: null,
        path: pathname,
        message: result.msg || ErrorMessages.NOT_FOUND,
        code: result.code,
      });
    }

    return respondWithCache(result);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    const errorCode =
      error instanceof Error && error.cause ? Number(error.cause) : 500;

    return errorHandle({
      identity: trimmedHandle,
      platform: null,
      path: pathname,
      message: errorMessage,
      code: isNaN(errorCode) ? 500 : errorCode,
    });
  }
}
