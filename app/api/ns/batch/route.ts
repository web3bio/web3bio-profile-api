import { errorHandle, getUserHeaders, respondWithCache } from "@/utils/base";
import { NextRequest } from "next/server";
import { fetchIdentityGraphBatch, filterIds, filterIdsPOST } from "../../profile/batch/utils";
import { ErrorMessages } from "@/utils/types";

export async function POST(req: NextRequest) {
  const { ids } = await req.json();
  const headers = getUserHeaders(req);
  if (!ids?.length)
    return errorHandle({
      identity: null,
      platform: "batch",
      code: 404,
      message: ErrorMessages.invalidIdentity,
    });
  try {

    const queryIds = filterIdsPOST(ids);
    const json = (await fetchIdentityGraphBatch(
      queryIds,
      true,
      headers
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

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const headers = getUserHeaders(req);
  const ids = searchParams.get("ids")?.split(",") || [];
  try {
    if (!ids?.length)
      return errorHandle({
        identity: null,
        platform: "batch",
        code: 404,
        message: ErrorMessages.invalidIdentity,
      });
    const queryIds = filterIds(ids);
    const json = (await fetchIdentityGraphBatch(
      queryIds,
      true,
      headers
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

export const runtime = "edge";
