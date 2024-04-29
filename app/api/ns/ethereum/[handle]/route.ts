import { errorHandle } from "@/utils/base";
import { PlatformType } from "@/utils/platform";
import { regexEns, regexEth } from "@/utils/regexp";
import { ErrorMessages } from "@/utils/types";
import { NextRequest } from "next/server";
import { resolveENSRespondNS } from "../../ens/[handle]/route";
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const inputName = searchParams.get("handle") || "";
  const lowercaseName = inputName?.toLowerCase();
  if (!regexEns.test(lowercaseName) && !regexEth.test(lowercaseName))
    return errorHandle({
      identity: lowercaseName,
      platform: PlatformType.ethereum,
      code: 404,
      message: ErrorMessages.invalidIdentity,
    });
  return resolveENSRespondNS(lowercaseName);
}

export const runtime = "edge";
export const preferredRegion = ["sfo1", "iad1", "pdx1"];
