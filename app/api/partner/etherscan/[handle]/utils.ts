import {
  ErrorMessages,
  Platform,
  type ProfileResponse,
} from "web3bio-profile-kit/types";
import { getPlatform } from "web3bio-profile-kit/utils";
import { resolveWithIdentityGraph } from "@/app/api/profile/[handle]/utils";
import { QueryType, queryIdentityGraph } from "@/utils/query";
import type { AuthHeaders } from "@/utils/types";
import { errorHandle, respondJson } from "@/utils/utils";

const ALLOWED_OUTPUT = new Set([
  Platform.ens,
  Platform.lens,
  Platform.farcaster,
  Platform.ethereum,
  Platform.solana,
  Platform.sns,
]);

const ICON_BASE = "https://web3.bio/";

const formatBio = (identity: string, description: string | null) =>
  description ? `${identity} · ${description}` : identity;

const normalizeWebsiteHandle = (handle: string) =>
  handle
    .replace(/^(?:https?:\/\/)?(?:www\.)?/i, "")
    .replace(/\/+$/, "")
    .toLowerCase();

const mapLinks = (data: ProfileResponse[]) => {
  const uniqueLinks = new Map<
    string,
    { platform: string; icon: string; link: string }
  >();
  const webHandles = new Set<string>();

  for (const item of data) {
    if (!item?.links) continue;

    for (const [platform, value] of Object.entries(item.links)) {
      if (!value?.handle || !value.link) continue;

      if (
        (item.platform === Platform.lens ||
          item.platform === Platform.farcaster) &&
        platform !== item.platform
      ) {
        continue;
      }

      const linkKey = `${platform},${value.handle.toLowerCase()}`;

      if ([Platform.website, Platform.url].includes(platform as Platform)) {
        const normalized = normalizeWebsiteHandle(value.handle);
        if (webHandles.has(normalized)) continue;
        webHandles.add(normalized);
      }

      if (uniqueLinks.has(linkKey)) continue;

      const icon = getPlatform(platform as Platform).icon;
      uniqueLinks.set(linkKey, {
        platform,
        link: value.link,
        icon: `${ICON_BASE}${icon}`,
      });
    }
  }

  return Array.from(uniqueLinks.values());
};

const toEtherscanProfile = (
  profile: ProfileResponse,
  links: { platform: string; icon: string; link: string }[],
) => ({
  address: profile.address || "",
  identity: profile.identity,
  platform: profile.platform,
  displayName: profile.displayName || profile.identity,
  avatar: profile.avatar,
  description: profile.description,
  bio: formatBio(profile.identity, profile.description),
  links,
});

export const resolveEtherscanHandle = async (
  handle: string,
  platform: Platform,
  headers: AuthHeaders,
  pathname: string,
) => {
  const response = await queryIdentityGraph(
    QueryType.GET_PROFILES,
    handle,
    platform,
    headers,
  );

  const resolutionResult = await resolveWithIdentityGraph({
    handle,
    platform,
    response,
    pathname,
  });

  if ("message" in resolutionResult) {
    return errorHandle({
      identity: resolutionResult.identity,
      path: pathname,
      platform: resolutionResult.platform,
      code: resolutionResult.code,
      message: resolutionResult.message,
    });
  }

  const filtered = (resolutionResult as ProfileResponse[]).filter((profile) =>
    ALLOWED_OUTPUT.has(profile.platform as Platform),
  );

  if (filtered.length === 0) {
    return errorHandle({
      identity: handle,
      path: pathname,
      platform,
      code: 404,
      message: ErrorMessages.NOT_FOUND,
    });
  }

  const aggregatedLinks = mapLinks(filtered);

  const profiles = filtered.map((profile, index) =>
    toEtherscanProfile(
      profile,
      index === 0 ? aggregatedLinks : mapLinks([profile]),
    ),
  );

  return respondJson(profiles);
};
