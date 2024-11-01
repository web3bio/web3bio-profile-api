import { errorHandle, respondWithCache } from "@/utils/base";
import { ErrorMessages } from "@/utils/types";
import { GET_PROFILES, queryIdentityGraph } from "@/utils/query";
import { PlatformType } from "@/utils/platform";

const formatContenthash = (string: string) => {
  if (string) {
    if (string.startsWith("/ipns")) {
      return `ipns://${string.replace("/ipns/", "")}`;
    }
    return `ipfs://${string}`;
  }
  return null;
};

const UDSocialAccountsList = [
  PlatformType.twitter,
  PlatformType.discord,
  PlatformType.reddit,
  PlatformType.lens,
  PlatformType.telegram,
  PlatformType.youtube,
];

const resolveUDHandle = async (handle: string) => {
  const response = await queryIdentityGraph(
    handle,
    PlatformType.unstoppableDomains,
    GET_PROFILES(true)
  );
  const profile = response?.data?.identity?.profile;
  if (!profile) throw new Error(ErrorMessages.notFound, { cause: 404 });

  // if (metadata.profile.web2Url) {
  //   linksObj[PlatformType.website] = {
  //     handle: resolveHandle(metadata.profile?.web2Url),
  //     link: getSocialMediaLink(metadata.profile?.web2Url, PlatformType.website),
  //   };
  // }
  // if (metadata.socialAccounts) {
  //   UDSocialAccountsList.forEach((x) => {
  //     const item = metadata.socialAccounts[x];
  //     if (item && item.location && PLATFORM_DATA.get(x)) {
  //       const resolvedHandle = resolveHandle(item?.location, x);
  //       linksObj[x] = {
  //         link: getSocialMediaLink(resolvedHandle, x),
  //         handle: resolvedHandle,
  //       };
  //     }
  //   });
  // }
  const linksObj: {
    [key in PlatformType]?: {
      link: string | null;
      handle: string | null;
    };
  } = {};
  return {
    address: profile.address,
    identity: profile.identity,
    platform: PlatformType.unstoppableDomains,
    displayName: profile.displayName || profile.handle,
    avatar: profile.avatar,
    description: profile.description,
    email: profile.texts?.email,
    location: profile.texts?.location,
    header: profile.texts?.cover,
    contenthash:
      formatContenthash(
        profile.contenthash || profile.texts?.["ipfs.html.value"]
      ) || null,
    links: linksObj,
    social: {
      uid: Number(profile.social?.uid),
      follower: profile.social?.follower || null,
      following: profile.social?.following || null,
    },
  };
};

export const resolveUDRespond = async (handle: string) => {
  try {
    const json = await resolveUDHandle(handle);
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
