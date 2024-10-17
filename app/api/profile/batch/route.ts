import { respondWithCache } from "@/utils/base";
import { NextRequest, NextResponse } from "next/server";
import { fetchIdentityGraphBatch } from "./utils";

export async function POST(req: NextRequest) {
  const { ids } = await req.json();
  if (!ids.length) return NextResponse.json([]);
  try {
    const json = await fetchIdentityGraphBatch(ids, false);
    return respondWithCache(JSON.stringify(json));
  } catch (e: any) {
    return NextResponse.json({
      error: e.message,
    });
  }
}

export const runtime = "edge";
