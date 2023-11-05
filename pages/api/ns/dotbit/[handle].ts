import { errorHandle, ErrorMessages, respondWithCache } from "@/utils/base";
import { PlatformType } from "@/utils/platform";
import { regexDotbit, regexEth } from "@/utils/regexp";
import { NextApiRequest } from "next";
import {
  resolveDotbitResponse,
} from "../../profile/dotbit/[handle]";

export const config = {
  runtime: "edge",
  regions: ["sfo1", "hnd1", "sin1"],
};

export const resolveDotbitHandleNS = async (handle: string) => {
  const { address, domain, recordsMap } = await resolveDotbitResponse(handle);
  return {
    address,
    identity: domain,
    platform: PlatformType.dotbit,
    displayName: domain || null,
    avatar: recordsMap.get("profile.avatar")?.value || null,
    description: recordsMap.get("profile.description")?.value || null,
  };
};

const resolveDotbitRespond = async (handle: string) => {
  try {
    const json = await resolveDotbitHandleNS(handle);
    return respondWithCache(JSON.stringify(json));
  } catch (e: any) {
    return errorHandle({
      identity: handle,
      platform: PlatformType.dotbit,
      code: e.cause || 500,
      message: e.message,
    });
  }
};

export default async function handler(req: NextApiRequest) {
  const { searchParams } = new URL(req.url as string);
  const inputName = searchParams.get("handle");
  const lowercaseName = inputName?.toLowerCase() || "";

  if (!regexDotbit.test(lowercaseName) && !regexEth.test(lowercaseName))
    return errorHandle({
      identity: lowercaseName,
      platform: PlatformType.dotbit,
      code: 404,
      message: ErrorMessages.invalidIdentity,
    });
  return resolveDotbitRespond(lowercaseName);
}
