import { errorHandle, getUserHeaders } from "@/utils/base";
import { NextRequest } from "next/server";
import { ErrorMessages } from "@/utils/types";
import { handleUniversalBatchRequest } from "./utils";

export async function GET(req: NextRequest) {
  const headers = getUserHeaders(req.headers);
  const { searchParams } = req.nextUrl;

  try {
    const ids = JSON.parse(searchParams.get("ids") || "");
    return handleUniversalBatchRequest(ids, headers, false);
  } catch (e: any) {
    return errorHandle({
      identity: searchParams.get("ids"),
      platform: "batch",
      code: 404,
      message: e.message || ErrorMessages.invalidIdentity,
    });
  }
}

export const runtime = "edge";
