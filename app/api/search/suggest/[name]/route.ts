import { GET_SEARCH_SUGGEST } from "@/utils/query";
import { IDENTITY_GRAPH_SERVER, respondWithCache } from "@/utils/utils";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest): Promise<NextResponse> {
  const { searchParams } = req.nextUrl;
  const name = searchParams.get("name");
  if (!name || typeof name !== "string") {
    return NextResponse.json([]);
  }

  const results = await fetch(IDENTITY_GRAPH_SERVER, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.WEB3BIO_IDENTITY_GRAPH_API_KEY || "",
    },
    body: JSON.stringify({
      query: GET_SEARCH_SUGGEST,
      variables: { name },
    }),
  })
    .then((res) => res.json())
    .then((result) => {
      if (!result || result.errors) {
        return [];
      }

      return result.data?.nameSuggest || [];
    })
    .catch((e) => {
      return [];
    });

  return respondWithCache(JSON.stringify(results));
}

export const runtime = "edge";
