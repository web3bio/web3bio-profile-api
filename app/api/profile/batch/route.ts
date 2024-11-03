import { respondWithCache } from "@/utils/base";
import { NextRequest, NextResponse } from "next/server";
import { fetchIdentityGraphBatch } from "./utils";
import { PlatformType } from "@/utils/platform";

export async function POST(req: NextRequest) {
  const { ids } = await req.json();
  if (!ids.length) return NextResponse.json([]);
  try {
    const queryIds = ids.filter((x: string) => {
      return [
        PlatformType.ens,
        PlatformType.basenames,
        PlatformType.ethereum,
        PlatformType.lens,
        PlatformType.farcaster,
      ].includes(x.split(",")[0] as PlatformType);
    });
    const json = await fetchIdentityGraphBatch(queryIds, false);
    return respondWithCache(JSON.stringify(json));
  } catch (e: any) {
    return NextResponse.json({
      error: e.message,
    });
  }
}

export const runtime = "edge";
