import type { NextRequest } from "next/server";
import { ErrorMessages } from "web3bio-profile-kit/types";
import { errorHandle, getUserHeaders, respondWithCache } from "@/utils/utils";
import { queryIdentityGraphBatch } from "@/utils/query";

export async function GET(req: NextRequest) {
  const headers = getUserHeaders(req.headers);
  const { searchParams } = req.nextUrl;
  try {
    const ids = JSON.parse(searchParams.get("ids") || "");
    const resJson = await queryIdentityGraphBatch(ids, true, headers);
    return respondWithCache(JSON.stringify(resJson));
  } catch (e: unknown) {
    return errorHandle({
      identity: searchParams.get("ids"),
      platform: "batch",
      code: 404,
      message: e instanceof Error ? e.message : ErrorMessages.INVALID_IDENTITY,
    });
  }
}

export const runtime = "edge";
