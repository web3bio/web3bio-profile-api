import { errorHandle, getUserHeaders, respondWithCache } from "@/utils/base";
import { PlatformType } from "@/utils/platform";
import { GET_PROFILES, queryIdentityGraph } from "@/utils/query";
import { resolveEipAssetURL } from "@/utils/resolver";
import { ErrorMessages, ProfileRecord } from "@/utils/types";
import { NextRequest, NextResponse } from "next/server";

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

export async function POST(req: NextRequest) {
  const body = await req.json();
  const headers = getUserHeaders(req);
  if (!body?.identity || !body?.platform)
    return errorHandle({
      identity: body?.identity,
      platform: body?.platform || "graph",
      code: 404,
      message: ErrorMessages.invalidIdentity,
    });
  try {
    const json = await queryIdentityGraph(
      body.identity,
      body.platform,
      GET_PROFILES(false),
      headers
    );
    if (json.code) {
      return errorHandle({
        identity: body?.identity,
        platform: body?.platform || "graph",
        code: json.code,
        message: json.msg || ErrorMessages.notFound,
      });
    }

    return respondWithCache(JSON.stringify(json));
  } catch (e: any) {
    return errorHandle({
      identity: body?.identity,
      platform: body?.platform,
      code: e.cause || 500,
      message: e.message || ErrorMessages.notFound,
    });
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const identity = searchParams.get("identity");
  const platform = searchParams.get("platform") as PlatformType;
  const headers = getUserHeaders(req);
  if (!identity || !platform)
    return errorHandle({
      identity: identity,
      platform: platform || "graph",
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
    if (rawJson.code) {
      return errorHandle({
        identity: identity,
        platform: platform || "graph",
        code: rawJson.code,
        message: rawJson.msg || ErrorMessages.notFound,
      });
    }

    return respondWithCache(JSON.stringify(await processJson(rawJson)));
  } catch (e: any) {
    return errorHandle({
      identity: identity,
      platform: platform,
      code: e.cause || 500,
      message: e.message || ErrorMessages.notFound,
    });
  }
}
