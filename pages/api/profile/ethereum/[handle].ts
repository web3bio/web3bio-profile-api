import { errorHandle, ErrorMessages } from "@/utils/base";
import { PlatformType } from "@/utils/platform";
import { regexEns, regexEth } from "@/utils/regexp";
import { NextApiRequest } from "next";
import { resolveENSRespond } from "../ens/[handle]";

export default async function handler(req: NextApiRequest) {
  const { searchParams } = new URL(req.url as string);
  const inputName = searchParams.get("handle") || "";
  const lowercaseName = inputName?.toLowerCase();
  if (!regexEns.test(lowercaseName) && !regexEth.test(lowercaseName))
    return errorHandle({
      identity: lowercaseName,
      platform: PlatformType.ethereum,
      code: 404,
      message: ErrorMessages.invalidIdentity,
    });
  return resolveENSRespond(lowercaseName);
}

export const config = {
  runtime: "edge",
  regions: ["sfo1", "hnd1", "sin1"],
  maxDuration: 45,
  unstable_allowDynamic: [
    "**/node_modules/lodash/**/*.js",
  ],
};
