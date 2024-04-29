import {
  errorHandle,
  handleSearchPlatform,
  shouldPlatformFetch,
} from "@/utils/base";
import { ErrorMessages } from "@/utils/types";
import { NextRequest } from "next/server";
import { resolveUniversalHandle } from "./utils";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const inputName = searchParams.get("handle")?.toLowerCase() || "";
  const platform = handleSearchPlatform(inputName);
  if (!inputName || !platform || !shouldPlatformFetch(platform)) {
    return errorHandle({
      identity: inputName,
      code: 404,
      platform: null,
      message: ErrorMessages.invalidIdentity,
    });
  }
  return await resolveUniversalHandle(inputName, req, platform, false);
}

export const runtime = "edge";
export const preferredRegion = ["sfo1", "iad1", "pdx1"];
