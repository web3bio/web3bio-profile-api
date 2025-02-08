import { getSocialMediaLink, resolveHandle } from "@/utils/resolver";
import { PlatformType } from "@/utils/platform";
import { regexTwitterLink } from "@/utils/regexp";
import {
  AuthHeaders,
  ErrorMessages,
  IdentityGraphEdge,
  ProfileRecord,
} from "@/utils/types";
import { GET_PROFILES, queryIdentityGraph } from "@/utils/query";
import { resolveVerifiedLink } from "@/utils/utils";

const resolveFarcasterLinks = (
  profile: ProfileRecord,
  edges: IdentityGraphEdge[]
) => {
  const linksObj = {
    [PlatformType.farcaster]: {
      link: getSocialMediaLink(profile.identity, PlatformType.farcaster),
      handle: profile.identity,
      sources: resolveVerifiedLink(
        `${PlatformType.farcaster},${profile.identity}`,
        edges
      ),
    },
  } as any;
  const twitterMatch = profile.description?.match(regexTwitterLink);
  if (twitterMatch) {
    const matched = twitterMatch[1];
    const resolveMatch = resolveHandle(matched, PlatformType.farcaster) || "";
    linksObj[PlatformType.twitter] = {
      link: getSocialMediaLink(resolveMatch, PlatformType.twitter),
      handle: resolveMatch,
      sources: resolveVerifiedLink(
        `${PlatformType.twitter},${resolveMatch}`,
        edges
      ),
    };
  }
  return linksObj;
};

export const resolveFarcasterHandle = async (
  handle: string,
  headers: AuthHeaders,
  ns?: boolean
) => {
  const response = await queryIdentityGraph(
    handle,
    PlatformType.farcaster,
    GET_PROFILES(ns),
    headers
  );

  if (response.msg) {
    return {
      identity: handle,
      platform: PlatformType.farcaster,
      message: response.msg,
      code: response.code,
    };
  }
  const profile = response?.data?.identity?.profile;
  if (!profile) throw new Error(ErrorMessages.notFound, { cause: 404 });
  const links = resolveFarcasterLinks(
    profile,
    response.data.identity.identityGraph?.edges
  );

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
      uid: Number(profile?.social?.uid),
    },
  };
};
