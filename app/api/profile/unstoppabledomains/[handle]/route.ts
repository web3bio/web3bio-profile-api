import { errorHandle } from "@/utils/base";
import { PlatformType } from "@/utils/platform";
import { regexEth, regexUnstoppableDomains } from "@/utils/regexp";
import { ErrorMessages } from "@/utils/types";
import { NextRequest } from "next/server";
import { resolveUDRespond } from "./utils";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const inputName = searchParams.get("handle");
  const lowercaseName = inputName?.toLowerCase() || "";

  if (
    !regexUnstoppableDomains.test(lowercaseName) &&
    !regexEth.test(lowercaseName)
  )
    return errorHandle({
      identity: lowercaseName,
      platform: PlatformType.unstoppableDomains,
      code: 404,
      message: ErrorMessages.invalidIdentity,
    });
  return resolveUDRespond(lowercaseName);
}

export const runtime = "edge";
