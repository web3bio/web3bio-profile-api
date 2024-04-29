import { errorHandle } from "@/utils/base";
import { PlatformType } from "@/utils/platform";
import { regexSns, regexSolana } from "@/utils/regexp";
import { NextApiRequest } from "next";
import { ErrorMessages } from "@/utils/types";
import { resolveSNSRespondNS } from "../sns/[handle]/route";

export default async function handler(req: NextApiRequest) {
  const { searchParams } = new URL(req.url as string);
  const inputName = searchParams.get("handle") || "";
  if (!regexSns.test(inputName) && !regexSolana.test(inputName))
    return errorHandle({
      identity: inputName,
      platform: PlatformType.solana,
      code: 404,
      message: ErrorMessages.invalidIdentity,
    });
  return resolveSNSRespondNS(inputName);
}
export const runtime = "edge";
export const preferredRegion = ["sfo1", "iad1", "pdx1"];
