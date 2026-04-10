import { getQuery, QueryType } from "@/utils/query";
import { errorHandle, respondJson } from "@/utils/utils";
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

const queryDomains = async (handle: string): Promise<GraphQLResponse> => {
  const response = await fetch(process.env.GRAPHQL_SERVER || "", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.WEB3BIO_API_KEY || "",
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

  try {
    const result = await queryDomains(trimmedHandle);

    if (result.errors) {
      return errorHandle({
        identity: trimmedHandle,
        platform: null,
        path: pathname,
        message: "GraphQL query failed",
        code: 500,
      });
    }

    if (result.code) {
      return errorHandle({
        identity: trimmedHandle,
        platform: null,
        path: pathname,
        message: result.msg || ErrorMessages.NOT_FOUND,
        code: result.code,
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
