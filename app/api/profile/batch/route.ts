import { respondWithCache } from "@/utils/base";
import { NextRequest, NextResponse } from "next/server";
import { NEXTID_GRAPHQL_ENDPOINT } from "../[handle]/utils";
import { BATCH_GET_PROFILES } from "@/utils/query";
import { ProfileRecord } from "@/utils/types";

async function fetchIdentityGraphBatch(
  ids: string[]
): Promise<ProfileRecord[] | { error: { message: string } }> {
  try {
    const response = await fetch(NEXTID_GRAPHQL_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: BATCH_GET_PROFILES,
        variables: {
          ids: ids,
        },
      }),
    });
    const result = await response.json();
    return result?.data?.identities?.map(
      (x: { profile: ProfileRecord }) => x.profile
    );
  } catch (e: any) {
    return { error: e.message };
  }
}

export async function POST(req: NextRequest) {
  const { ids } = await req.json();
  if (!ids.length) return NextResponse.json([]);
  try {
    const json = await fetchIdentityGraphBatch(ids);
    return respondWithCache(JSON.stringify(json));
  } catch (e: any) {
    return NextResponse.json({
      error: e.message,
    });
  }
}

export async function GET() {
  return NextResponse.json("batch profile api");
}

export const runtime = "edge";
