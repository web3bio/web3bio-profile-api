import { ErrorMessages } from "@/utils/types";
import {
  errorHandle,
  handleSearchPlatform,
  shouldPlatformFetch,
} from "@/utils/base";
import { resolveUniversalHandle } from "../profile/[handle]";
import { NextRequest } from "next/server";

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
  return await resolveUniversalHandle(inputName, req, platform, true);
}
export const runtime = "edge";
export const preferredRegion = ["sfo1", "iad1", "pdx1"];