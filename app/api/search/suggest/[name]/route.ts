import { getQuery, QueryType } from "@/utils/query";
import {
  getUserHeaders,
  IDENTITY_GRAPH_SERVER,
  respondJson,
} from "@/utils/utils";
import { NextRequest, NextResponse } from "next/server";
import { Platform } from "web3bio-profile-kit/types";

interface NameSuggest {
  name: string;
  platform: Platform;
}

export async function GET(
  req: NextRequest,
  props: { params: Promise<{ name: string }> },
): Promise<NextResponse> {
  const { name } = await props.params;
  if (!name || typeof name !== "string") {
    return NextResponse.json([]);
  }
  const headers = getUserHeaders(req.headers);
  const results = await fetch(IDENTITY_GRAPH_SERVER, {
    method: "POST",
    headers: {
      ...headers,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query: getQuery(QueryType.GET_SEARCH_SUGGEST),
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

  return respondJson(results);
}
