import { respondWithCache } from "@/utils/base";
import { NextRequest, NextResponse } from "next/server";
import { NEXTID_GRAPHQL_ENDPOINT } from "../[handle]/utils";
import { BATCH_GET_PROFILES } from "@/utils/query";

async function fetchIdentityGraphBatch(ids: string[]) {
  try {
    const response = await fetch(NEXTID_GRAPHQL_ENDPOINT, {
      method: "POST",
      body: JSON.stringify({
        query: BATCH_GET_PROFILES,
        variables: {
          ids,
        },
      }),
    });
    return await response.json();
  } catch (e) {
    return { errors: e };
  }
}

export async function POST(req: NextRequest) {
  const { ids } = await req.json();
  if (!ids.length) return NextResponse.json([]);
  try {
    const json = await fetchIdentityGraphBatch(ids);
    return respondWithCache(JSON.stringify(json));
  } catch (e: any) {
    return NextResponse.error();
  }
}

export const runtime = "edge";
