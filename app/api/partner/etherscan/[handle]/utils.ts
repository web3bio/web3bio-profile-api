import {
  ErrorMessages,
  Platform,
  type ProfileResponse,
} from "web3bio-profile-kit/types";
import { getPlatform } from "web3bio-profile-kit/utils";
import { resolveWithIdentityGraph } from "@/app/api/profile/[handle]/utils";
import { SOCIAL_PLATFORMS } from "@/utils/base";
import { QueryType, queryIdentityGraph } from "@/utils/query";
import { resolveHandle } from "@/utils/resolver";
import type { AuthHeaders } from "@/utils/types";
import { errorHandle, respondJson } from "@/utils/utils";

const ALLOWED = new Set([
  Platform.ens,
  Platform.lens,
  Platform.farcaster,
  Platform.ethereum,
  Platform.solana,
  Platform.sns,
]);

const ICON_BASE = "https://web3.bio/";

const mapLinks = (profiles: ProfileResponse[]) => {
  const links = new Map<
    string,
    { platform: string; icon: string; link: string }
  >();
  const websites = new Set<string>();

  for (const profile of profiles) {
    if (!profile.links) continue;

    for (const [platform, value] of Object.entries(profile.links)) {
      if (!value?.handle || !value.link) continue;
      if (
        SOCIAL_PLATFORMS.has(profile.platform) &&
        platform !== profile.platform
      ) {
        continue;
      }

      if (platform === Platform.website || platform === Platform.url) {
        const key = resolveHandle(value.handle, Platform.website);
        if (!key || websites.has(key)) continue;
        websites.add(key);
      }

      const linkKey = `${platform},${value.handle.toLowerCase()}`;
      if (links.has(linkKey)) continue;

      links.set(linkKey, {
        platform,
        link: value.link,
        icon: `${ICON_BASE}${getPlatform(platform as Platform).icon}`,
      });
    }
  }

  return [...links.values()];
};

export const resolveEtherscanHandle = async (
  handle: string,
  platform: Platform,
  headers: AuthHeaders,
  pathname: string,
) => {
  const result = await resolveWithIdentityGraph({
    handle,
    platform,
    pathname,
    response: await queryIdentityGraph(
      QueryType.GET_PROFILES,
      handle,
      platform,
      headers,
    ),
  });

  if ("message" in result) {
    return errorHandle({
      identity: result.identity,
      path: pathname,
      platform: result.platform,
      code: result.code,
      message: result.message,
    });
  }

  const profiles = (result as ProfileResponse[]).filter((p) =>
    ALLOWED.has(p.platform as Platform),
  );
  if (!profiles.length) {
    return errorHandle({
      identity: handle,
      path: pathname,
      platform,
      code: 404,
      message: ErrorMessages.NOT_FOUND,
    });
  }

  const profile = profiles[0];
  return respondJson({
    address: profile.address || "",
    identity: profile.identity,
    platform: profile.platform,
    displayName: profile.displayName || profile.identity,
    avatar: profile.avatar,
    description: profile.description,
    bio: profile.description
      ? `${profile.identity} · ${profile.description}`
      : profile.identity,
    links: mapLinks(profiles),
  });
};
