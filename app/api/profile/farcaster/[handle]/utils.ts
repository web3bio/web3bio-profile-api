import { getSocialMediaLink, resolveHandle } from "@/utils/resolver";
import { PlatformType } from "@/utils/platform";
import { regexTwitterLink } from "@/utils/regexp";
import { ErrorMessages, ProfileRecord } from "@/utils/types";
import { GET_SINGLE_PROFILE, queryIdentityGraph } from "@/utils/query";

const resolveFarcasterLinks = (profile: ProfileRecord) => {
  const linksObj = {
    [PlatformType.farcaster]: {
      link: getSocialMediaLink(profile.identity, PlatformType.farcaster),
      handle: profile.identity,
    },
  } as any;
  const twitterMatch = profile.description?.match(regexTwitterLink);
  if (twitterMatch) {
    const matched = twitterMatch[1];
    const resolveMatch = resolveHandle(matched, PlatformType.farcaster) || "";
    linksObj[PlatformType.twitter] = {
      link: getSocialMediaLink(resolveMatch, PlatformType.twitter),
      handle: resolveMatch,
    };
  }
  return linksObj;
};

export const resolveFarcasterHandle = async (handle: string) => {
  const response = await queryIdentityGraph(
    handle,
    PlatformType.farcaster,
    GET_SINGLE_PROFILE
  );
  const profile = response?.data?.identity?.profile;
  if (!profile) throw new Error(ErrorMessages.notFound, { cause: 404 });
  const links = resolveFarcasterLinks(profile);

  return {
    address: profile.address,
    identity: profile.identity,
    platform: PlatformType.farcaster,
    displayName: profile.displayName || profile.identity,
    avatar: profile.avatar,
    description: profile.description,
    email: profile.texts?.email || null,
    location: profile.texts?.location || null,
    header: null,
    contenthash: null,
    links: links,
    social: {
      ...profile.social,
      uid: Number(profile.social.uid),
    },
  };
};
