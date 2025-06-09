import { type NextRequest, NextResponse } from "next/server";
import type { Platform } from "web3bio-profile-kit/types";
import { QueryType, queryIdentityGraph } from "@/utils/query";
import { getUserHeaders } from "@/utils/utils";

// e.g `https://api.web3.bio/revalidate/ens,sujiyan.eth`
export async function GET(req: NextRequest) {
  const headers = getUserHeaders(req.headers);
  const { searchParams } = req.nextUrl;
  const id = searchParams.get("id");
  if (!id || !id.includes(",")) {
    return NextResponse.json({ message: "Missing Params" }, { status: 400 });
  }
  const [platform, identity] = id.split(",");
  const res = await queryIdentityGraph(
    QueryType.GET_REFRESH_PROFILE,
    identity,
    platform as Platform,
    headers,
  );
  const refreshed = res?.data?.identity;
  if (!refreshed || res.errors)
    return NextResponse.json({ error: res.errors }, { status: 500 });

  return NextResponse.json({
    id,
    status: refreshed.status,
    now: new Date(),
  });
}
