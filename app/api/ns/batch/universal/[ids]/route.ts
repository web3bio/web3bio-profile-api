import { errorHandle, getUserHeaders } from "@/utils/base";
import { NextRequest } from "next/server";
import { ErrorMessages } from "@/utils/types";
import { handleUniversalBatchRequest } from "@/app/api/profile/batch/universal/[ids]/utils";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const headers = getUserHeaders(req);
  try {
    const ids = JSON.parse(searchParams.get("ids") || "");
    return handleUniversalBatchRequest(ids, headers, true);
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
