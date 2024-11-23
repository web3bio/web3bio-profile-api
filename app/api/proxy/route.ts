import { getUserHeaders, respondWithCache } from "@/utils/base";
import { PlatformType } from "@/utils/platform";
import { GET_PROFILES, queryIdentityGraph } from "@/utils/query";
import { ErrorMessages } from "@/utils/types";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const headers = getUserHeaders(req);
  try {
    const json = await queryIdentityGraph(
      body.identity,
      body.platform,
      GET_PROFILES(false),
      headers
    );

    return respondWithCache(JSON.stringify(json));
  } catch (e) {
    return NextResponse.json({
      error: e,
    });
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const identity = searchParams.get("identity");
  const platform = searchParams.get("platform") as PlatformType;
  const headers = getUserHeaders(req);
  if (!identity || !platform)
    return NextResponse.json({
      code: 404,
      message: ErrorMessages.invalidIdentity,
    });
  try {
    const json = await queryIdentityGraph(
      identity,
      platform,
      GET_PROFILES(false),
      headers
    );

    return respondWithCache(JSON.stringify(json));
  } catch (e) {
    return NextResponse.json({
      error: e,
    });
  }
}
