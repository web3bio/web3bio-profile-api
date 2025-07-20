import { GET_SEARCH_SUGGEST } from "@/utils/query";
import { IDENTITY_GRAPH_SERVER, respondWithCache } from "@/utils/utils";
import { NextRequest, NextResponse } from "next/server";
import { Platform } from "web3bio-profile-kit/types";

interface NameSuggest {
  name: string;
  platform: Platform;
}

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

      return (
        result.data?.nameSuggest.map((x: NameSuggest) => {
          if (x.platform === Platform.box) {
            return {
              platform: Platform.ens,
              name: x.name,
            };
          } else {
            return x;
          }
        }) || []
      );
    })
    .catch((e) => {
      return [];
    });

  return respondWithCache(results, true);
}

export const runtime = "edge";
