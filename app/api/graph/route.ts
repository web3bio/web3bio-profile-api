import { getUserHeaders, respondWithCache } from "@/utils/base";
import { PlatformType } from "@/utils/platform";
import { GET_PROFILES, queryIdentityGraph } from "@/utils/query";
import { resolveEipAssetURL } from "@/utils/resolver";
import { ErrorMessages, ProfileRecord } from "@/utils/types";
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

    return respondWithCache(JSON.stringify(json), headers);
  } catch (e) {
    return NextResponse.json({
      error: e,
    });
  }
}

const processAvatar = async (profile: ProfileRecord) => {
  if (!profile) return null;
  const _profile = JSON.parse(JSON.stringify(profile));

  try {
    _profile.avatar = await resolveEipAssetURL(
      _profile?.avatar,
      profile.identity
    );
  } catch {
    _profile.avatar = null;
  }
  if (
    _profile.platform === PlatformType.lens &&
    !_profile.avatar &&
    _profile?.social?.uid
  ) {
    _profile.avatar = `https://api.hey.xyz/avatar?id=${Number(
      _profile.social.uid
    )}`;
  }

  return _profile;
};

const processJson = async (json: any) => {
  const _json = JSON.parse(JSON.stringify(json));
  const identity = _json?.data?.identity;
  if (identity?.profile) {
    identity.profile = await processAvatar(identity.profile);
  }
  if (identity?.identityGraph?.vertices?.length > 0) {
    for (let i = 0; i < identity.identityGraph.vertices.length; i++) {
      const item = identity.identityGraph.vertices[i];
      if (item?.profile) {
        item.profile = await processAvatar(item.profile);
      }
    }
  }
  return _json;
};

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
    let rawJson = await queryIdentityGraph(
      identity,
      platform,
      GET_PROFILES(false),
      headers
    );

    return respondWithCache(
      JSON.stringify(await processJson(rawJson)),
      headers
    );
  } catch (e) {
    return NextResponse.json({
      error: e,
    });
  }
}
