import type { NextRequest } from "next/server";
import { type BatchMode, queryIdentityGraphBatch } from "@/utils/query";
import {
  errorHandle, getErrorCauseCode, getUserHeaders, invalidIdentityResponse, respondJson,
} from "@/utils/utils";

function parseIds(value: string): string[] | null {
  try {
    const json = value.trimStart().startsWith("[") ? value : decodeURIComponent(value);
    const ids: unknown = JSON.parse(json);
    return Array.isArray(ids) && ids.length <= 30 && ids.every(id => typeof id === "string") ? ids : null;
  } catch {
    return null;
  }
}

export function batchHandler(mode: BatchMode) {
  return async function GET(req: NextRequest, { params }: { params: Promise<{ ids: string }> }) {
    const { ids: value } = await params;
    const path = req.nextUrl.pathname;
    const ids = parseIds(value);
    if (!ids) return invalidIdentityResponse(path, value, null, 400);

    try {
      return respondJson(await queryIdentityGraphBatch(ids, mode, getUserHeaders(req.headers)));
    } catch (error) {
      return errorHandle({
        identity: value, platform: null, path,
        code: getErrorCauseCode(error),
        message: error instanceof Error ? error.message : "Identity Graph request failed",
      });
    }
  };
}
