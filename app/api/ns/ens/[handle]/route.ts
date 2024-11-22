import { errorHandle, getUserHeaders } from "@/utils/base";
import { PlatformType } from "@/utils/platform";
import { regexEns, regexEth } from "@/utils/regexp";
import { ErrorMessages } from "@/utils/types";
import { NextRequest } from "next/server";
import { resolveENSRespondNS } from "./utils";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const headers = getUserHeaders(req);
  const inputName = searchParams.get("handle") || "";
  const lowercaseName = inputName?.toLowerCase();
  if (!regexEns.test(lowercaseName) && !regexEth.test(lowercaseName))
    return errorHandle({
      identity: lowercaseName,
      platform: PlatformType.ens,
      code: 404,
      message: ErrorMessages.invalidIdentity,
    });
  return resolveENSRespondNS(lowercaseName, headers);
}

export const runtime = "edge";
