import { errorHandle, getUserHeaders, respondWithCache } from "@/utils/base";
import { PlatformType } from "@/utils/platform";
import { QueryType, queryIdentityGraph } from "@/utils/query";
import { ErrorMessages } from "@/utils/types";
import { NextRequest } from "next/server";
import { processJson } from "./utils";

export async function GET(req: NextRequest) {
  const headers = getUserHeaders(req.headers);
  const { searchParams } = req.nextUrl;
  const identity = searchParams.get("identity");
  const platform = searchParams.get("platform") as PlatformType;

  if (!identity || !platform)
    return errorHandle({
      identity: identity,
      platform: platform || "graph",
      code: 404,
      message: ErrorMessages.invalidIdentity,
    });
  try {
    let rawJson = await queryIdentityGraph(
      QueryType.GET_GRAPH_QUERY,
      identity,
      platform,
      headers,
    );

    if (rawJson.code || rawJson.errors) {
      return errorHandle({
        identity: identity,
        platform: platform || "graph",
        code: rawJson.code,
        message: rawJson.msg
          ? rawJson.msg
          : rawJson.errors
            ? JSON.stringify(rawJson.errors)
            : ErrorMessages.notFound,
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
