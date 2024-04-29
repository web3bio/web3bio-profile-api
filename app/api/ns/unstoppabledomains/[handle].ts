import { errorHandle, respondWithCache } from "@/utils/base";
import { PlatformType } from "@/utils/platform";
import { regexEth, regexUnstoppableDomains } from "@/utils/regexp";
import { NextApiRequest } from "next";
import { ErrorMessages } from "@/utils/types";
import { resolveUDResponse } from "../../profile/unstoppabledomains/[handle]";

export const resolveUDHandleNS = async (handle: string) => {
  const { address, domain, metadata } = await resolveUDResponse(handle);
  return {
    address,
    identity: domain,
    platform: PlatformType.unstoppableDomains,
    displayName: metadata.profile.displayName || handle,
    avatar: metadata.profile.imagePath || null,
    description: metadata.profile.description || null,
  };
};

const resolveUDRespond = async (handle: string) => {
  try {
    const json = await resolveUDHandleNS(handle);
    return respondWithCache(JSON.stringify(json));
  } catch (e: any) {
    return errorHandle({
      identity: handle,
      platform: PlatformType.unstoppableDomains,
      code: e.cause || 500,
      message: e.message,
    });
  }
};

export default async function handler(req: NextApiRequest) {
  const { searchParams } = new URL(req.url as string);
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

export const config = {
  runtime: "edge",
  regions: ["sfo1", "iad1", "pdx1"],
};
