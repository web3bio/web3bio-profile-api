import {
  getSocialMediaLink,
  resolveEipAssetURL,
  resolveHandle,
} from "@/utils/resolver";
import { PLATFORM_DATA, PlatformType } from "@/utils/platform";
import { ErrorMessages, LinksItem } from "@/utils/types";
import { GET_PROFILES, queryIdentityGraph } from "@/utils/query";
import { resolveVerifiedLink } from "../../[handle]/utils";

export const resolveDotbitHandle = async (handle: string, ns?: boolean) => {
  const response = await queryIdentityGraph(
    handle,
    PlatformType.dotbit,
    GET_PROFILES(ns)
  );

  const profile = response?.data?.identity?.profile;

  if (!profile) throw new Error(ErrorMessages.notFound, { cause: 404 });

  const nsObj = {
    address: profile.address,
    identity: profile.identity || handle,
    platform: PlatformType.dotbit,
    displayName: profile.displayName || profile.identity,
    avatar: resolveEipAssetURL(profile.avatar),
    description: profile.description || null,
  };
  const linksObj: Record<string, LinksItem> = {};

  if (profile?.texts) {
    const keys = Object.keys(profile.texts);
    keys.forEach((x) => {
      if (PLATFORM_DATA.has(x as PlatformType)) {
        const item = profile.texts[x];
        const handle = resolveHandle(item, x as PlatformType);
        linksObj[x] = {
          link: getSocialMediaLink(item, x as PlatformType)!,
          handle,
          sources: resolveVerifiedLink(
            `${x},${handle}`,
            response?.data?.identityGraph?.edges
          ),
        };
      }
    });
  }

  return ns
    ? nsObj
    : {
        ...nsObj,
        email: profile.texts?.email || null,
        location: profile.texts?.location || null,
        header: profile.texts?.header || null,
        contenthash: profile.contenthash || null,
        links: linksObj,
        social: {},
      };
};
