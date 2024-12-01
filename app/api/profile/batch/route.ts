import { errorHandle, getUserHeaders, respondWithCache } from "@/utils/base";
import { NextRequest } from "next/server";
import { fetchIdentityGraphBatch, filterIds } from "./utils";
import { ErrorMessages } from "@/utils/types";

async function handleRequest(ids: any, headers: any) {
  if (!ids?.length)
    return errorHandle({
      identity: null,
      platform: "batch",
      code: 404,
      message: ErrorMessages.invalidIdentity,
    });
  try {
    const queryIds = filterIds(ids);
    const json = (await fetchIdentityGraphBatch(
      queryIds,
      false,
      headers,
    )) as any;
    if (json.code) {
      return errorHandle({
        identity: JSON.stringify(ids),
        platform: "batch",
        code: json.code,
        message: json.msg,
      });
    }
    return respondWithCache(JSON.stringify(json));
  } catch (e: any) {
    return errorHandle({
      identity: JSON.stringify(ids),
      platform: "batch",
      code: e.cause || 500,
      message: ErrorMessages.notFound,
    });
  }
}

export async function POST(req: NextRequest) {
  const { ids } = await req.json();
  const headers = getUserHeaders(req);
  return handleRequest(ids, headers);
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const headers = getUserHeaders(req);
  const ids = JSON.parse(searchParams.get("ids") || "");
  return handleRequest(ids, headers);
}

export const runtime = "edge";
