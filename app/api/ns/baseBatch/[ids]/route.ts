import type { NextRequest } from "next/server";
import { ErrorMessages } from "web3bio-profile-kit/types";
import { errorHandle, getUserHeaders } from "@/utils/utils";
import { handleOrininalbatch } from "@/app/api/profile/baseBatch/[ids]/utils";

export async function GET(req: NextRequest) {
  const headers = getUserHeaders(req.headers);
  const { searchParams } = req.nextUrl;

  try {
    const ids = JSON.parse(searchParams.get("ids") || "");
    return handleOrininalbatch(ids, headers, true);
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
