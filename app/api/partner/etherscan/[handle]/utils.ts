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
const BG_OPACITY = 10;
const NETWORK_PLATFORMS = new Set([Platform.ethereum, Platform.solana]);
const WEBSITE_PLATFORMS = new Set([Platform.website, Platform.url]);
const LINK_RANK = new Map(
  [Platform.ens, Platform.lens, Platform.farcaster].map((p, i) => [p, i]),
);

type EtherscanLinkItem = {
  platform: string;
  icon: string;
  color: string;
  bgColor: string;
  link: string;
};

type LinkSource = Pick<ProfileResponse, "platform" | "links"> & {
  identity?: string;
};

const bgColorCache = new Map<string, string>();

const hexToBgColor = (hex: string) => {
  if (!hex) return "";
  const cached = bgColorCache.get(hex);
  if (cached !== undefined) return cached;

  const normalized = hex.replace("#", "");
  if (normalized.length !== 6) {
    bgColorCache.set(hex, "");
    return "";
  }

  const ratio = BG_OPACITY / 100;
  const blend = (channel: number) =>
    Math.round(channel * ratio + 255 * (1 - ratio));
  const bgColor = `#${[0, 2, 4]
    .map((index) => blend(parseInt(normalized.slice(index, index + 2), 16)))
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("")}`;

  bgColorCache.set(hex, bgColor);
  return bgColor;
};

const toLinkItem = (platform: string, link: string): EtherscanLinkItem => {
  const { icon, color = "" } = getPlatform(platform as Platform);
  return {
    platform,
    icon: `${WEB3BIO}/${icon}`,
    color,
    bgColor: hexToBgColor(color),
    link,
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
): EtherscanLinkItem[] => {
  const links = new Map<string, EtherscanLinkItem>();
  const websites = new Set<string>();
  let hasEnsLink = false;

  for (const { platform: ownerPlatform, links: linkItems } of sources) {
    if (!linkItems) continue;

    for (const [platform, value] of Object.entries(linkItems)) {
      if (!value?.handle || !value.link) continue;
      if (SOCIAL_PLATFORMS.has(ownerPlatform) && platform !== ownerPlatform) {
        continue;
      }

      if (WEBSITE_PLATFORMS.has(platform as Platform)) {
        const websiteKey = resolveHandle(value.handle, Platform.website);
        if (!websiteKey || websites.has(websiteKey)) continue;
        websites.add(websiteKey);
      }

      const dedupeKey = `${platform},${value.handle.toLowerCase()}`;
      if (links.has(dedupeKey)) continue;

      if (platform === Platform.ens) hasEnsLink = true;
      links.set(dedupeKey, toLinkItem(platform, value.link));
    }
  }

  const result = [...links.values()];
  if (aggregate && queryPlatform !== Platform.ens && !hasEnsLink) {
    const ensProfile = sources.find((item) => item.platform === Platform.ens);
    if (ensProfile?.identity) {
      result.push(toLinkItem(Platform.ens, `${WEB3BIO}/${ensProfile.identity}`));
    }
  }

  return result.sort(
    (left, right) =>
      (LINK_RANK.get(left.platform as Platform) ?? 99) -
      (LINK_RANK.get(right.platform as Platform) ?? 99),
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

const resolveAvatar = async (avatar: string | null | undefined) => {
  if (!avatar) return null;

  try {
    const resolved = await resolveEipAssetURL(avatar);
    if (!resolved) return null;
    new URL(resolved);
    return resolved;
  } catch {
    return null;
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
    resolveAvatar(profile.avatar),
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
