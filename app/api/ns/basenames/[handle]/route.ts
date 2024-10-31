import { errorHandle, prettify, uglify } from "@/utils/base";
import { PlatformType } from "@/utils/platform";
import { regexBasenames, regexEns, regexEth } from "@/utils/regexp";
import { ErrorMessages } from "@/utils/types";
import { NextRequest } from "next/server";
import { resolveENSRespondNS } from "../../ens/[handle]/utils";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const inputName = searchParams.get("handle") || "";
  const lowercaseName = uglify(
    inputName?.toLowerCase(),
    PlatformType.basenames
  );
  if (!regexBasenames.test(lowercaseName) && !regexEth.test(lowercaseName))
    return errorHandle({
      identity: lowercaseName,
      platform: PlatformType.basenames,
      code: 404,
      message: ErrorMessages.invalidIdentity,
    });
  return resolveENSRespondNS(lowercaseName, PlatformType.basenames);
}

export const runtime = "edge";
