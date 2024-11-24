import { ErrorMessages } from "@/utils/types";
import {
  errorHandle,
  getUserHeaders,
  handleSearchPlatform,
  shouldPlatformFetch,
} from "@/utils/base";
import { NextRequest } from "next/server";
import { resolveUniversalHandle } from "../../profile/[handle]/utils";
import { regexSolana, regexBtc } from "@/utils/regexp";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const headers = getUserHeaders(req);
  const handle = searchParams.get("handle") || "";
  const inputName = [regexSolana, regexBtc].some((x) => x.test(handle))
    ? handle
    : handle.toLowerCase();
  const platform = handleSearchPlatform(inputName);
  if (!inputName || !platform || !shouldPlatformFetch(platform)) {
    return errorHandle({
      identity: inputName,
      code: 404,
      platform: null,
      message: ErrorMessages.invalidIdentity,
    });
  }
  return await resolveUniversalHandle(inputName, platform, headers, true);
}
export const runtime = "edge";
