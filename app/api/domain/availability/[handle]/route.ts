import { type AuthHeaders } from "@/utils/types";
import {
  IDENTITY_GRAPH_SERVER,
  errorHandle,
  getUserHeaders,
  respondWithCache,
} from "@/utils/utils";
import type { NextRequest } from "next/server";
import { ErrorMessages } from "web3bio-profile-kit/types";

const GET_AVAILABLE_DOMAINS = `
  query GET_AVAILABLE_DOMAINS($name: String!) {
    domainAvailableSearch(name: $name) {
      platform
      name
      expiredAt
      availability
      status
    }
  }
`;

const queryDomains = async (handle: string, headers: AuthHeaders) => {
  try {
    const response = await fetch(IDENTITY_GRAPH_SERVER, {
      method: "POST",
      headers: {
        ...headers,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: GET_AVAILABLE_DOMAINS,
        variables: {
          name: handle,
        },
      }),
    });

    return await response.json();
  } catch (e) {
    return {
      errors: e,
    };
  }
};

export async function GET(req: NextRequest) {
  const headers = getUserHeaders(req.headers);
  const { searchParams, pathname } = req.nextUrl;
  const name = searchParams.get("handle");

  if (!name)
    return errorHandle({
      identity: null,
      path: pathname,
      platform: null,
      message: ErrorMessages.INVALID_IDENTITY,
      code: 404,
    });
  try {
    const json = await queryDomains(name, headers);
    if (json.code) {
      return errorHandle({
        identity: name,
        platform: null,
        path: pathname,
        message: json.msg || ErrorMessages.NOT_FOUND,
        code: json.code,
      });
    }
    return respondWithCache(JSON.stringify(json));
  } catch (e: unknown) {
    return errorHandle({
      identity: name,
      platform: null,
      path: pathname,
      message: e instanceof Error ? e.message : ErrorMessages.NOT_FOUND,
      code: e instanceof Error ? Number(e.cause) || 500 : 500,
    });
  }
}
