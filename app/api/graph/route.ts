import { errorHandle, getUserHeaders, respondWithCache } from "@/utils/base";
import { PlatformType } from "@/utils/platform";
import { GET_GRAPH_QUERY, queryIdentityGraph } from "@/utils/query";
import { ErrorMessages } from "@/utils/types";
import { NextRequest } from "next/server";
import { processJson } from "./utils";

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
      GET_GRAPH_QUERY,
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
