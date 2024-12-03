import { errorHandle, getUserHeaders, respondWithCache } from "@/utils/base";
import { PlatformType } from "@/utils/platform";
import { GET_PROFILES, queryIdentityGraph } from "@/utils/query";
import { ErrorMessages } from "@/utils/types";
import { NextRequest } from "next/server";
import { processJson } from "./utils";

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
    if (json.code || json.errors) {
      return errorHandle({
        identity: body?.identity,
        platform: body?.platform || "graph",
        code: json.code,
        message: json.msg
          ? json.msg
          : json.errors
          ? json.stringify(json.errors)
          : ErrorMessages.notFound,
      });
    }
    const result = await processJson(json);

    return respondWithCache(JSON.stringify(result));
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
    const result = await processJson(rawJson);

    return respondWithCache(JSON.stringify(result));
  } catch (e: any) {
    return errorHandle({
      identity: identity,
      platform: platform,
      code: e.cause || 500,
      message: e.message || ErrorMessages.notFound,
    });
  }
}
