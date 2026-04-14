import { ErrorMessages, type Platform } from "web3bio-profile-kit/types";
import { errorHandle } from "@/utils/utils";

export const invalidIdentityResponse = (
  pathname: string,
  handle: string,
  platform: Platform | null = null,
  code = 404,
) =>
  errorHandle({
    identity: handle,
    code,
    path: pathname,
    platform,
    message: ErrorMessages.INVALID_IDENTITY,
  });

export const parseResolvedIdentityHandle = (
  resolvedIdentity: string | null,
): [Platform, string] | null => {
  if (!resolvedIdentity) {
    return null;
  }

  const [platform, identity] = resolvedIdentity.split(",") as [Platform, string];
  return platform && identity ? [platform, identity] : null;
};
