import { errorHandle } from "@/utils/base";
import { PlatformType } from "@/utils/platform";
import { regexSns, regexSolana } from "@/utils/regexp";
import { ErrorMessages } from "@/utils/types";
import { NextRequest } from "next/server";
import { resolveSNSRespond } from "./utils";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url as string);
  const inputName = searchParams.get("handle");
  if (
    (!regexSns.test(inputName!) && !regexSolana.test(inputName!)) ||
    !inputName
  )
    return errorHandle({
      identity: inputName,
      platform: PlatformType.sns,
      code: 404,
      message: ErrorMessages.invalidIdentity,
    });

  return resolveSNSRespond(inputName);
}
export const runtime = "edge";
export const preferredRegion = ["sfo1", "iad1", "pdx1"];
