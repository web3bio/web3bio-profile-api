import { getUserHeaders } from "@/utils/base";
import { PlatformType } from "@/utils/platform";
import { QueryType, queryIdentityGraph } from "@/utils/query";
import { NextRequest, NextResponse } from "next/server";

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
    platform as PlatformType,
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
