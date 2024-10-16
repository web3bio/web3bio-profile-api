import { respondWithCache } from "@/utils/base";
import { NextRequest, NextResponse } from "next/server";
import { fetchIdentityGraphBatch } from "../../profile/batch/route";

export async function POST(req: NextRequest) {
  const { ids } = await req.json();
  if (!ids.length) return NextResponse.json([]);
  try {
    const json = await fetchIdentityGraphBatch(ids, true);
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
