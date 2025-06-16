import { QueryType, queryIdentityGraph } from "@/utils/query";
import {
  errorHandle,
  getUserHeaders,
  isSingleWeb2Identity,
  respondWithCache,
} from "@/utils/utils";
import type { NextRequest } from "next/server";
import { type Platform, ErrorMessages } from "web3bio-profile-kit/types";
import { processJson } from "./utils";

export async function GET(req: NextRequest) {
  const headers = getUserHeaders(req.headers);
  const { searchParams, pathname } = req.nextUrl;
  const identity = searchParams.get("identity");
  const platform = searchParams.get("platform") as Platform;

  if (!identity || !platform)
    return errorHandle({
      identity: identity,
      path: pathname,
      platform: platform,
      code: 404,
      message: ErrorMessages.INVALID_IDENTITY,
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
        path: pathname,
        platform: platform,
        code: rawJson.code,
        message: rawJson.msg
          ? rawJson.msg
          : rawJson.errors
            ? JSON.stringify(rawJson.errors)
            : ErrorMessages.NOT_FOUND,
      });
    }

    if (isSingleWeb2Identity(rawJson.data.identity)) {
      return errorHandle({
        identity: identity,
        path: pathname,
        platform: platform || "graph",
        code: 404,
        message: ErrorMessages.NOT_FOUND,
      });
    }

    const result = await processJson(rawJson);

    return respondWithCache(JSON.stringify(result));
  } catch (e: unknown) {
    return errorHandle({
      identity: identity,
      path: pathname,
      platform: platform,
      message: e instanceof Error ? e.message : ErrorMessages.NOT_FOUND,
      code: e instanceof Error ? Number(e.cause) || 500 : 500,
    });
  }
}
