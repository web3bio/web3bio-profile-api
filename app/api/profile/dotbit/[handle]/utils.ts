import {
  resolveEipAssetURL,
} from "@/utils/resolver";
import { PlatformType } from "@/utils/platform";
import { ErrorMessages } from "@/utils/types";
import { GET_PROFILES, queryIdentityGraph } from "@/utils/query";

export const resolveDotbitHandle = async (handle: string, ns?: boolean) => {
  const response = await queryIdentityGraph(
    handle,
    PlatformType.dotbit,
    GET_PROFILES(ns)
  );

  const profile = response?.data?.identity?.profile;

  if (!profile) throw new Error(ErrorMessages.notFound, { cause: 404 });
  console.log(profile, "profile");
  const nsObj = {
    address: profile.address,
    identity: profile.identity || handle,
    platform: PlatformType.dotbit,
    displayName: profile.displayName || profile.identity,
    avatar: resolveEipAssetURL(profile.avatar) || null,
    description: profile.description || null,
  };

  return ns
    ? nsObj
    : {
        ...nsObj,
        email: profile.texts?.email || null,
        location: profile.texts?.location || null,
        header: profile.texts?.header || null,
        contenthash: profile.contenthash || null,
        links: {},
        social: {},
      };

  // recordsMap.forEach((x, key) => {
  //   if (key.startsWith("profile.")) {
  //     const field = key.replace("profile.", "");
  //     if (
  //       ["avatar", "header", "location", "description", "email"].includes(field)
  //     ) {
  //       profile[field] = x.value || null;
  //     } else if (x.value) {
  //       const handle = resolveHandle(x.value, field as PlatformType);
  //       profile.links[field] = {
  //         link: getSocialMediaLink(x.value, field as PlatformType)!,
  //         handle,
  //       };
  //     }
  //   } else if (key.startsWith("dweb")) {
  //     profile.contenthash = `${key.replace("dweb.", "")}://${x.value}`;
  //   }
  // });
};
