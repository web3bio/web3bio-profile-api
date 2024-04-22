import { errorHandle } from "@/utils/base";
import { PlatformType } from "@/utils/platform";
import { regexSns, regexSolana } from "@/utils/regexp";
import { NextApiRequest } from "next";
import { resolveSNSRespond } from "../sns/[handle]";
import { ErrorMessages } from "@/utils/types";

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
  return resolveSNSRespond(inputName);
}
export const config = {
  runtime: "edge",
  regions: ["sfo1", "iad1", "pdx1"],
  maxDuration: 45,
  unstable_allowDynamic: [
    "/node_modules/rpc-websockets/node_modules/@babel/runtime/regenerator/index.js",
  ],
};
