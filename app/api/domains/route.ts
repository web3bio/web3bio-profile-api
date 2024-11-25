import { getUserHeaders, respondWithCache } from "@/utils/base";
import { AuthHeaders, ErrorMessages } from "@/utils/types";
import { NextRequest, NextResponse } from "next/server";
import { IDENTITY_GRAPH_SERVER } from "../profile/[handle]/utils";

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

export async function POST(req: NextRequest) {
  const body = await req.json();
  const headers = getUserHeaders(req);
  try {
    const json = await queryDomains(body.name, headers);
    return respondWithCache(JSON.stringify(json));
  } catch (e) {
    return NextResponse.json({
      error: e,
    });
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const name = searchParams.get("name");
  const headers = getUserHeaders(req);
  if (!name)
    return NextResponse.json({
      code: 404,
      message: ErrorMessages.invalidIdentity,
    });
  try {
    const json = await queryDomains(name, headers);

    return respondWithCache(JSON.stringify(json));
  } catch (e) {
    return NextResponse.json({
      error: e,
    });
  }
}
