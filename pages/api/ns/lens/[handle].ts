import { errorHandle, ErrorMessages, respondWithCache } from "@/utils/base";
import { PlatformType } from "@/utils/platform";
import { regexEth, regexLens } from "@/utils/regexp";
import { resolveEipAssetURL } from "@/utils/resolver";
import { NextApiRequest } from "next";
import { resolveLensResponse } from "../../profile/lens/[handle]";

export const resolveLensHandleNS = async (handle: string) => {
  const response = await resolveLensResponse(handle);
  if (!response) throw new Error(ErrorMessages.notFound, { cause: 404 });
  const avatarUri =
    response.picture?.original?.url || response.picture?.uri || null;

  const resJSON = {
    address: response.ownedBy?.toLowerCase(),
    identity: response.handle,
    platform: PlatformType.lens,
    displayName: response.name || response.handle,
    avatar: (await resolveEipAssetURL(avatarUri)) || null,
    description: response.bio || null,
  };
  return resJSON;
};

const resolveLensRespond = async (handle: string) => {
  try {
    const json = await resolveLensHandleNS(handle);
    return respondWithCache(JSON.stringify(json));
  } catch (e: any) {
    return errorHandle({
      identity: handle,
      platform: PlatformType.lens,
      code: e.cause || 500,
      message: e.message,
    });
  }
};

export default async function handler(req: NextApiRequest) {
  const { searchParams } = new URL(req.url as string);
  const inputName = searchParams.get("handle");
  const lowercaseName = inputName?.toLowerCase() || "";

  if (!regexLens.test(lowercaseName) && !regexEth.test(lowercaseName))
    return errorHandle({
      identity: lowercaseName,
      platform: PlatformType.lens,
      code: 404,
      message: ErrorMessages.invalidIdentity,
    });
  return resolveLensRespond(lowercaseName);
}

export const config = {
  runtime: "edge",
  regions: ["sfo1", "hnd1", "sin1"],
};
