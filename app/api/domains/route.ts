import {
  IDENTITY_GRAPH_SERVER,
  errorHandle,
  getUserHeaders,
  respondWithCache,
} from "@/utils/base";
import { AuthHeaders, ErrorMessages } from "@/utils/types";
import { NextRequest } from "next/server";

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
  const { searchParams } = req.nextUrl;
  const name = searchParams.get("name");

  if (!name)
    return errorHandle({
      identity: null,
      platform: "domains",
      message: ErrorMessages.invalidIdentity,
      code: 404,
    });
  try {
    const json = await queryDomains(name, headers);
    if (json.code) {
      return errorHandle({
        identity: name,
        platform: "domains",
        message: json.msg || ErrorMessages.notFound,
        code: json.code,
      });
    }
    return respondWithCache(JSON.stringify(json));
  } catch (e: any) {
    return errorHandle({
      identity: name,
      platform: "domains",
      message: e.message || ErrorMessages.notFound,
      code: e?.cause || 500,
    });
  }
}
