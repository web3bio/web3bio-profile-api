import { handleSearchPlatform } from "@/utils/utils";
import { RequestInterface, resolveUniversalHandle } from "../profile/[handle]";
import { ErrorMessages, errorHandle } from "@/utils/base";
import { PlatformType } from "@/utils/platform";

export default async function handler(req: RequestInterface) {
  const searchParams = new URLSearchParams(req.url?.split("?")[1] || "");
  const inputName = searchParams.get("handle")?.toLowerCase() || "";
  if (!inputName || !handleSearchPlatform(inputName)) {
    return errorHandle({
      identity: inputName,
      code: 500,
      platform: PlatformType.nextid,
      message: ErrorMessages.invalidIdentity,
    });
  }
  return await resolveUniversalHandle(inputName, req, true);
}

export const config = {
  runtime: "edge",
  regions: ["sfo1", "hnd1", "sin1"],
  unstable_allowDynamic: [
    "**/node_modules/lodash/**/*.js",
    "**/node_modules/@ensdomain/address-encoder/**/*.js",
    "**/node_modules/js-sha256/**/*.js",
  ],
};
