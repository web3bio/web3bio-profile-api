import {
  getSocialMediaLink,
  resolveEipAssetURL,
  resolveHandle,
} from "@/utils/resolver";
import { PLATFORM_DATA, PlatformType } from "@/utils/platform";
import { AuthHeaders, ErrorMessages, Links } from "@/utils/types";
import { GET_PROFILES, queryIdentityGraph } from "@/utils/query";
import { resolveVerifiedLink } from "@/utils/utils";

export const resolveDotbitHandle = async (
  handle: string,
  headers: AuthHeaders,
  ns?: boolean,
) => {
  const response = await queryIdentityGraph(
    handle,
    PlatformType.dotbit,
    GET_PROFILES(ns),
    headers,
  );
  if (response.msg) {
    return {
      identity: handle,
      platform: PlatformType.dotbit,
      message: response.msg,
      code: response.code,
    };
  }
  const profile = response?.data?.identity?.profile;

  if (!profile) throw new Error(ErrorMessages.notFound, { cause: 404 });

  const nsObj = {
    address: profile.address,
    identity: profile.identity || handle,
    platform: PlatformType.dotbit,
    displayName: profile.displayName || profile.identity,
    avatar: await resolveEipAssetURL(profile.avatar, profile.identity),
    description: profile.description || null,
  };

  if (ns) return nsObj;
  let linksObj: Partial<Links> = {};

  if (profile?.texts) {
    Object.entries(profile.texts)
      .filter(([key]) => PLATFORM_DATA.has(key as PlatformType))
      .forEach(([key, value]) => {
        const platformKey = key as PlatformType;
        const platformValue = (value as string) || "";
        const handle = resolveHandle(platformValue, platformKey);

        linksObj[platformKey] = {
          link: getSocialMediaLink(platformValue, platformKey)!,
          handle,
          sources: resolveVerifiedLink(
            `${key},${handle}`,
            response?.data?.identityGraph?.edges,
          ),
        };
      });
  }

  return {
    ...nsObj,
    email: profile.texts?.email || null,
    location: profile.texts?.location || null,
    header: profile.texts?.header || null,
    contenthash: profile.contenthash || null,
    links: linksObj,
    social: {},
  };
};
