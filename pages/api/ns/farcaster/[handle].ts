import { errorHandle, ErrorMessages, respondWithCache } from "@/utils/base";
import { PlatformType } from "@/utils/platform";
import { regexEth, regexFarcaster } from "@/utils/regexp";
import { NextApiRequest } from "next";
import { resolveFarcasterResponse } from "../../profile/farcaster/[handle]";

export const resolveFarcasterHandleNS = async (handle: string) => {
  const response = await resolveFarcasterResponse(handle);
  if (!response?.fid) throw new Error(ErrorMessages.notFound, { cause: 404 });
  const resJSON = {
    address: response.address || null,
    identity: response.username,
    platform: PlatformType.farcaster,
    displayName: response.displayName || response.username,
    avatar: response.pfp.url,
    description: response.profile.bio.text || null,
  };
  return resJSON;
};

const resolveFarcasterRespondNS = async (handle: string) => {
  try {
    const json = await resolveFarcasterHandleNS(handle);
    return respondWithCache(JSON.stringify(json));
  } catch (e: any) {
    return errorHandle({
      identity: handle,
      platform: PlatformType.farcaster,
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
    !regexFarcaster.test(lowercaseName) &&
    !regexEth.test(lowercaseName) &&
    !lowercaseName.endsWith(".farcaster")
  )
    return errorHandle({
      identity: lowercaseName,
      platform: PlatformType.farcaster,
      code: 404,
      message: ErrorMessages.invalidIdentity,
    });

  const queryInput = lowercaseName.endsWith(".farcaster")
    ? lowercaseName.replace(".farcaster", "")
    : lowercaseName;
  return resolveFarcasterRespondNS(queryInput);
}

export const config = {
  runtime: "edge",
  regions: ["sfo1", "hnd1", "sin1"],
};
