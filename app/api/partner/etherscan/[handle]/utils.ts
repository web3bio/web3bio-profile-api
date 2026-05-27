import { Platform, type ProfileResponse } from "web3bio-profile-kit/types";
import {
  getPlatform,
  isSameAddress,
  isValidEthereumAddress,
} from "web3bio-profile-kit/utils";
import { resolveWithIdentityGraph } from "@/app/api/profile/[handle]/utils";
import { SOCIAL_PLATFORMS } from "@/utils/base";
import { QueryType, queryIdentityGraph } from "@/utils/query";
import { resolveHandle } from "@/utils/resolver";
import type { AuthHeaders } from "@/utils/types";
import { errorHandle, formatText, normalizeText, respondJson } from "@/utils/utils";

export const ALLOWED_PLATFORMS = new Set([
  Platform.ens,
  Platform.lens,
  Platform.farcaster,
  Platform.ethereum,
  Platform.solana,
  Platform.sns,
]);

const WEB3BIO = "https://web3.bio";
const NETWORK_PLATFORMS = new Set([Platform.ethereum, Platform.solana]);
const LINK_RANK = new Map(
  [Platform.ens, Platform.farcaster, Platform.lens].map((p, i) => [p, i]),
);

const platformIcon = (platform: Platform | string) =>
  `${WEB3BIO}/${getPlatform(platform as Platform).icon}`;

const mapLinks = (
  all: ProfileResponse[],
  source: ProfileResponse[],
  queryPlatform: Platform,
  aggregate: boolean,
) => {
  const links = new Map<string, { platform: string; icon: string; link: string }>();
  const websites = new Set<string>();

  for (const { platform: owner, links: items } of source) {
    if (!items) continue;
    for (const [platform, value] of Object.entries(items)) {
      if (!value?.handle || !value.link) continue;
      if (SOCIAL_PLATFORMS.has(owner) && platform !== owner) continue;
      if (platform === Platform.website || platform === Platform.url) {
        const key = resolveHandle(value.handle, Platform.website);
        if (!key || websites.has(key)) continue;
        websites.add(key);
      }
      const key = `${platform},${value.handle.toLowerCase()}`;
      if (!links.has(key)) {
        links.set(key, { platform, link: value.link, icon: platformIcon(platform) });
      }
    }
  }

  const result = [...links.values()];
  if (
    aggregate &&
    queryPlatform !== Platform.ens &&
    !result.some((l) => l.platform === Platform.ens)
  ) {
    const ens = all.find((p) => p.platform === Platform.ens);
    if (ens) {
      result.push({
        platform: Platform.ens,
        link: `${WEB3BIO}/${ens.identity}`,
        icon: platformIcon(Platform.ens),
      });
    }
  }

  return result.sort(
    (a, b) =>
      (LINK_RANK.get(a.platform as Platform) ?? 99) -
      (LINK_RANK.get(b.platform as Platform) ?? 99),
  );
};

const pickProfile = (
  profiles: ProfileResponse[],
  handle: string,
  platform: Platform,
) => {
  if (NETWORK_PLATFORMS.has(platform)) {
    return (
      profiles.find((p) => p.address && isSameAddress(p.address, handle)) ??
      profiles.find(
        (p) => p.platform === platform && isSameAddress(p.identity, handle),
      )
    );
  }
  const identity = normalizeText(handle);
  return profiles.find(
    (p) => p.platform === platform && p.identity === identity,
  );
};

const toEthFallback = (handle: string, profiles: ProfileResponse[]) => {
  const address =
    (isValidEthereumAddress(handle) && handle) ||
    profiles.find((p) => p.address && isValidEthereumAddress(p.address))
      ?.address ||
    handle;
  return {
    address,
    identity: address,
    platform: Platform.ethereum,
    displayName: formatText(address),
    avatar: null,
    description: null,
  } as ProfileResponse;
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
    ALLOWED_PLATFORMS.has(p.platform as Platform),
  );
  const profile =
    pickProfile(profiles, handle, platform) ?? toEthFallback(handle, profiles);
  const aggregate = !NETWORK_PLATFORMS.has(profile.platform);

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
    links: mapLinks(
      profiles,
      aggregate ? profiles : [profile],
      platform,
      aggregate,
    ),
  });
};
