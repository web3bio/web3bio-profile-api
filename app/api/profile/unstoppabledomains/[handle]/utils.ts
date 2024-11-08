import { errorHandle, respondWithCache } from "@/utils/base";
import { ErrorMessages } from "@/utils/types";
import { GET_PROFILES, queryIdentityGraph } from "@/utils/query";
import { PLATFORM_DATA, PlatformType } from "@/utils/platform";
import { getSocialMediaLink, resolveHandle } from "@/utils/resolver";
import { resolveVerifiedLink } from "../../[handle]/utils";

const formatContenthash = (string: string) => {
  if (string) {
    if (string.startsWith("/ipns")) {
      return `ipns://${string.replace("/ipns/", "")}`;
    }
    return `ipfs://${string}`;
  }
  return null;
};

export const UDSocialAccountsList = [
  PlatformType.twitter,
  PlatformType.discord,
  PlatformType.reddit,
  PlatformType.lens,
  PlatformType.telegram,
  PlatformType.youtube,
  PlatformType.website,
  PlatformType.url,
];

const resolveUDHandle = async (handle: string) => {
  const response = await queryIdentityGraph(
    handle,
    PlatformType.unstoppableDomains,
    GET_PROFILES(true)
  );
  const profile = response?.data?.identity?.profile;
  if (!profile) throw new Error(ErrorMessages.notFound, { cause: 404 });
  const linksObj: {
    [key in PlatformType]?: {
      link: string | null;
      handle: string | null;
      sources?: string[];
    };
  } = {};

  if (profile.texts) {
    UDSocialAccountsList.forEach((x) => {
      const item = profile.texts[x];
      if (item && PLATFORM_DATA.get(x)) {
        const resolvedHandle = resolveHandle(item, x);
        linksObj[x] = {
          link: getSocialMediaLink(resolvedHandle, x),
          handle: resolvedHandle,
          sources: resolveVerifiedLink(
            `${x},${resolvedHandle}`,
            response.identityGraph?.edges
          ),
        };
      }
    });
  }
  return {
    address: profile.address,
    identity: profile.identity,
    platform: PlatformType.unstoppableDomains,
    displayName: profile.displayName || profile.handle,
    avatar: profile.avatar,
    description: profile.description,
    email: profile.texts?.email || null,
    location: profile.texts?.location || null,
    header: profile.texts?.header || null,
    contenthash: formatContenthash(profile.contenthash),
    links: linksObj,
    social: {
      ...profile.social,
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
