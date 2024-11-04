import {
  errorHandle,
  handleSearchPlatform,
  shouldPlatformFetch,
} from "@/utils/base";
import { ErrorMessages } from "@/utils/types";
import { NextRequest } from "next/server";
import { resolveUniversalHandle } from "./utils";
import { regexSolana, regexBtc } from "@/utils/regexp";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
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
  return await resolveUniversalHandle(inputName, platform, false);
}

export const runtime = "edge";
