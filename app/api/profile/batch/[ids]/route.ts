import { errorHandle, getUserHeaders } from "@/utils/utils";
import type { NextRequest } from "next/server";
import { ErrorMessages } from "@/utils/types";
import { handleRequest } from "./utils";

export async function GET(req: NextRequest) {
  const headers = getUserHeaders(req.headers);
  const { searchParams } = req.nextUrl;

  try {
    const ids = JSON.parse(searchParams.get("ids") || "");
    return handleRequest(ids, headers, false);
  } catch (e: unknown) {
    return errorHandle({
      identity: searchParams.get("ids"),
      platform: "batch",
      code: 404,
      message: e instanceof Error ? e.message : ErrorMessages.invalidIdentity,
    });
  }
}

export const runtime = "edge";
