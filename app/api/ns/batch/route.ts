import { errorHandle, getUserHeaders } from "@/utils/base";
import { NextRequest } from "next/server";
import { ErrorMessages } from "@/utils/types";
import { handleRequest } from "../../profile/batch/utils";

export async function POST(req: NextRequest) {
  const { ids } = await req.json();
  const headers = getUserHeaders(req);
  return handleRequest(ids, headers, true);
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const headers = getUserHeaders(req);
  try {
    const ids = JSON.parse(searchParams.get("ids") || "");
    return handleRequest(ids, headers, true);
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
