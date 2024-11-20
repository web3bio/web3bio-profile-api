import { respondWithCache } from "@/utils/base";
import { NextRequest, NextResponse } from "next/server";
import { PlatformType } from "@/utils/platform";
import { fetchIdentityGraphBatch } from "../../profile/batch/utils";

const filterIds = (ids: string[]) =>
  ids.filter((x: string) => {
    return [
      PlatformType.ens,
      PlatformType.basenames,
      PlatformType.ethereum,
      PlatformType.lens,
      PlatformType.farcaster,
    ].includes(x.split(",")[0] as PlatformType);
  });

export async function POST(req: NextRequest) {
  const { ids } = await req.json();
  if (!ids.length) return NextResponse.json([]);
  try {
    const queryIds = filterIds(ids);
    const json = await fetchIdentityGraphBatch(queryIds, true);
    return respondWithCache(JSON.stringify(json));
  } catch (e: any) {
    return NextResponse.json({
      error: e.message,
    });
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  try {
    const ids = searchParams.get("ids")?.split(",") || [];
    const mergedIds = [];
    for (let i = 0; i < ids.length; i += 2) {
      mergedIds.push(`${ids[i]},${ids[i + 1]}`);
    }
    const queryIds = filterIds(mergedIds);
    const json = await fetchIdentityGraphBatch(queryIds, true);
    return respondWithCache(JSON.stringify(json));
  } catch (e: any) {
    return NextResponse.json({
      error: e.message,
    });
  }
}

export const runtime = "edge";
