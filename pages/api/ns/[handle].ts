import { handleSearchPlatform } from "@/utils/utils";
import { RequestInterface, resolveUniversalHandle } from "../profile/[handle]";
import { ErrorMessages, errorHandle, shouldPlatformFetch } from "@/utils/base";

export default async function handler(req: RequestInterface) {
  const searchParams = new URLSearchParams(req.url?.split("?")[1] || "");
  const inputName = searchParams.get("handle")?.toLowerCase() || "";
  const platform = handleSearchPlatform(inputName);
  if (!inputName || !platform || !shouldPlatformFetch(platform)) {
    return errorHandle({
      identity: inputName,
      code: 404,
      platform: null,
      message: ErrorMessages.invalidIdentity,
    });
  }
  return await resolveUniversalHandle(inputName, req, platform, true);
}

export const config = {
  runtime: "edge",
  regions: ["sfo1", "hnd1", "sin1"],
};
