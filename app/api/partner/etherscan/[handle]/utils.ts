import {
  Network,
  Platform,
  type ProfileResponse,
  type SocialLinks,
} from "web3bio-profile-kit/types";
import {
  getPlatform,
  isSameAddress,
  isValidEthereumAddress,
  isWeb3Address,
} from "web3bio-profile-kit/utils";
import { extractSortedProfileRecords } from "@/app/api/profile/[handle]/utils";
import { generateSocialLinks, SOCIAL_PLATFORMS } from "@/utils/base";
import { QueryType, queryIdentityGraph } from "@/utils/query";
import { resolveEipAssetURL, resolveHandle } from "@/utils/resolver";
import type { AuthHeaders, IdentityGraphEdge, ProfileRecord } from "@/utils/types";
import {
  BASE_URL,
  errorHandle,
  formatText,
  normalizeText,
  respondJson,
} from "@/utils/utils";

export const ALLOWED_PLATFORMS = new Set([
  Platform.ens,
  Platform.lens,
  Platform.farcaster,
  Platform.ethereum,
  Platform.solana,
  Platform.sns,
]);

const WEB3BIO = "https://web3.bio";
const BORDER_OPACITY = 20;
const BG_OPACITY = 10;
const NETWORK_PLATFORMS = new Set([Platform.ethereum, Platform.solana]);
const WEBSITE_PLATFORMS = new Set([Platform.website, Platform.url]);
const LINK_RANK = new Map(
  [Platform.ens, Platform.lens, Platform.farcaster, Platform.twitter].map(
    (p, i) => [p, i],
  ),
);

type EtherscanLinkItem = {
  platform: string;
  icon: string;
  borderColor: string;
  bgColor: string;
};

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const toLinkHtml = ({
  platform,
  icon,
  borderColor,
  bgColor,
}: EtherscanLinkItem) => {
  const safeIcon = escapeHtml(icon);
  const safePlatform = escapeHtml(platform);
  const safeBorderColor = escapeHtml(borderColor);
  const safeBgColor = escapeHtml(bgColor);

  return `<span style='display:inline-flex;align-items:center;padding:4px;border:1px solid ${safeBorderColor};background-color:${safeBgColor};border-radius:6px;margin-right:4px;'><img src='${safeIcon}' alt='${safePlatform}' width='14' height='14' style='display:block;flex-shrink:0;opacity:0.5;' /></span>`;
};

type LinkSource = Pick<ProfileResponse, "platform" | "links"> & {
  identity?: string;
};

const blendCache = new Map<string, string>();

const hexBlendWithWhite = (hex: string, opacity: number) => {
  if (!hex) return "";
  const cacheKey = `${hex}:${opacity}`;
  const cached = blendCache.get(cacheKey);
  if (cached !== undefined) return cached;

  const normalized = hex.replace("#", "");
  if (normalized.length !== 6) {
    blendCache.set(cacheKey, "");
    return "";
  }

  const ratio = opacity / 100;
  const blend = (channel: number) =>
    Math.round(channel * ratio + 255 * (1 - ratio));
  const blended = `#${[0, 2, 4]
    .map((index) => blend(parseInt(normalized.slice(index, index + 2), 16)))
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("")}`;

  blendCache.set(cacheKey, blended);
  return blended;
};

const toLinkItem = (platform: string): EtherscanLinkItem => {
  const { icon, color: platformColor = "" } = getPlatform(platform as Platform);
  return {
    platform,
    icon: `${WEB3BIO}/${icon}`,
    borderColor: hexBlendWithWhite(platformColor, BORDER_OPACITY),
    bgColor: hexBlendWithWhite(platformColor, BG_OPACITY),
  };
};

const formatBio = (
  identity: string,
  displayName: string,
  description: string | null,
) => {
  if (!description) return "";
  if (displayName !== identity) return `${identity} · ${description}`;
  return description;
};

const toDisplayName = (profile: ProfileRecord) =>
  profile.displayName ||
  (isWeb3Address(profile.identity)
    ? formatText(profile.identity)
    : profile.identity);

const mapLinks = (
  sources: LinkSource[],
  queryPlatform: Platform,
  aggregate: boolean,
): Record<string, string> => {
  const links = new Map<string, EtherscanLinkItem>();
  const websites = new Set<string>();
  let hasEnsLink = false;

  for (const { platform: ownerPlatform, links: linkItems } of sources) {
    if (!linkItems) continue;

    for (const [platform, value] of Object.entries(linkItems)) {
      if (!value?.handle) continue;
      if (SOCIAL_PLATFORMS.has(ownerPlatform) && platform !== ownerPlatform) {
        continue;
      }

      if (WEBSITE_PLATFORMS.has(platform as Platform)) {
        const websiteKey = resolveHandle(value.handle, Platform.website);
        if (!websiteKey || websites.has(websiteKey)) continue;
        websites.add(websiteKey);
      }

      if (links.has(platform)) continue;

      if (platform === Platform.ens) hasEnsLink = true;
      links.set(platform, toLinkItem(platform));
    }
  }

  const result = [...links.values()];
  if (aggregate && queryPlatform !== Platform.ens && !hasEnsLink) {
    const ensProfile = sources.find((item) => item.platform === Platform.ens);
    if (ensProfile?.identity) {
      result.push(toLinkItem(Platform.ens));
    }
  }

  const sorted = result.sort(
    (left, right) =>
      (LINK_RANK.get(left.platform as Platform) ?? 99) -
      (LINK_RANK.get(right.platform as Platform) ?? 99),
  );

  return Object.fromEntries(
    sorted.map((item, index) => [`link${index + 1}`, toLinkHtml(item)]),
  );
};

const pickProfile = (
  profiles: ProfileRecord[],
  handle: string,
  platform: Platform,
) => {
  if (NETWORK_PLATFORMS.has(platform)) {
    return (
      profiles.find((profile) =>
        profile.address ? isSameAddress(profile.address, handle) : false,
      ) ??
      profiles.find(
        (profile) =>
          profile.platform === platform &&
          isSameAddress(profile.identity, handle),
      )
    );
  }

  const normalizedIdentity = normalizeText(handle);
  return profiles.find(
    (profile) =>
      profile.platform === platform &&
      profile.identity === normalizedIdentity,
  );
};

const toEthFallback = (
  handle: string,
  candidateRecords: ProfileRecord[],
): ProfileRecord => {
  const address =
    (isValidEthereumAddress(handle) && handle) ||
    candidateRecords.find(
      (profile) => profile.address && isValidEthereumAddress(profile.address),
    )?.address ||
    handle;

  return {
    address,
    identity: address,
    platform: Platform.ethereum,
    displayName: formatText(address),
    avatar: null,
    description: "",
  } as ProfileRecord;
};

const resolveProfile = (
  allowedRecords: ProfileRecord[],
  allRecords: ProfileRecord[],
  handle: string,
  platform: Platform,
) =>
  pickProfile(allowedRecords, handle, platform) ??
  toEthFallback(
    handle,
    allowedRecords.length > 0 ? allowedRecords : allRecords,
  );

const resolveAddress = (profile: ProfileRecord) => {
  if (profile.platform !== Platform.farcaster) {
    return profile.address || "";
  }

  const addresses = profile.addresses;
  if (!addresses?.length) return profile.address || "";

  const primaryAddress =
    addresses.find(
      (item) => item.network === Network.ethereum && item.isPrimary,
    ) || addresses.find((item) => item.isPrimary);

  return (
    primaryAddress?.address ||
    addresses.find((item) => item.network === Network.ethereum)?.address ||
    addresses[0].address ||
    profile.address ||
    ""
  );
};

const toDefaultAvatarUrl = (platform: Platform, identity: string) =>
  `${BASE_URL}/avatar/svg/${platform},${encodeURIComponent(identity)}`;

const resolveAvatar = async (
  avatar: string | null | undefined,
  platform: Platform,
  identity: string,
): Promise<string> => {
  const fallback = toDefaultAvatarUrl(platform, identity);
  if (!avatar) return fallback;

  try {
    const resolved = await resolveEipAssetURL(avatar);
    if (!resolved) return fallback;
    new URL(resolved);
    return resolved;
  } catch {
    return fallback;
  }
};

const buildLinkSources = async (
  records: ProfileRecord[],
  edges: IdentityGraphEdge[] | undefined,
): Promise<LinkSource[]> =>
  Promise.all(
    records.map(async (record) => {
      const { links } = await generateSocialLinks(record, edges);
      return {
        platform: record.platform,
        identity: record.identity,
        links: links as SocialLinks,
      };
    }),
  );

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
  const recordsResult = extractSortedProfileRecords(handle, platform, response);

  if ("message" in recordsResult) {
    return errorHandle({
      identity: recordsResult.identity,
      path: pathname,
      platform: recordsResult.platform,
      code: recordsResult.code,
      message: recordsResult.message,
    });
  }

  const allowedRecords = recordsResult.filter((record) =>
    ALLOWED_PLATFORMS.has(record.platform),
  );
  const profile = resolveProfile(
    allowedRecords,
    recordsResult,
    handle,
    platform,
  );
  const shouldAggregateLinks = !NETWORK_PLATFORMS.has(profile.platform);
  const linkRecords = shouldAggregateLinks ? allowedRecords : [profile];
  const edges = response.data?.identity?.identityGraph?.edges;

  const [avatar, linkSources] = await Promise.all([
    resolveAvatar(profile.avatar, profile.platform, profile.identity),
    buildLinkSources(linkRecords, edges),
  ]);
  const displayName = toDisplayName(profile);

  return respondJson({
    address: resolveAddress(profile),
    identity: profile.identity,
    platform: profile.platform,
    displayName,
    avatar,
    bio: formatBio(profile.identity, displayName, profile.description || null),
    links: mapLinks(linkSources, platform, shouldAggregateLinks),
  });
};
