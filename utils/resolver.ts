import { ARWEAVE_ASSET_PREFIX, SIMPLEHASH_URL } from "./base";
import { _fetcher } from "./fetcher";
import { isIPFS_Resource, resolveIPFS_URL } from "./ipfs";
import { chainIdToNetwork } from "./networks";
import { PlatformType, SocialPlatformMapping } from "./platform";
import { regexDomain, regexEIP } from "./regexp";

export const resolveMediaURL = (
  url: string,
  identity?: string,
): string | null => {
  if (!url) return null;
  if (url.startsWith("data:") || url.startsWith("https://")) return url;
  if (url.startsWith("ar://"))
    return url.replace("ar://", ARWEAVE_ASSET_PREFIX);
  if (url.startsWith("ipfs://") || isIPFS_Resource(url))
    return resolveIPFS_URL(url) || url;
  return identity
    ? `https://api.web3.bio/api/avatar/svg?hanlde=${identity}`
    : url;
};

export const resolveHandle = (
  handle: string,
  platform?: PlatformType,
): string | null => {
  if (!handle) return null;
  if (platform === PlatformType.website) {
    return handle
      .replace(/^(?:https?:\/\/)?(?:www\.)?/i, "")
      .replace(/\/+$/g, "")
      .toLowerCase();
  }

  if (platform === PlatformType.youtube) {
    const match = handle.match(/@(.*?)(?=[\/]|$)/);
    return match ? match[0] : "";
  }

  if (
    platform &&
    [PlatformType.lens, PlatformType.hey].includes(platform) &&
    handle.endsWith(".lens")
  ) {
    handle = handle.slice(0, -5);
  }

  if (regexDomain.test(handle)) {
    const parts = handle.split("/");
    return (
      handle.endsWith("/") ? parts[parts.length - 2] : parts[parts.length - 1]
    )
      .replace(/@/g, "")
      .split("?")[0]
      .toLowerCase();
  }

  return handle.replace(/@/g, "").toLowerCase();
};

export const getSocialMediaLink = (
  url: string | null,
  type: PlatformType | string,
): string | null => {
  if (!url) return null;
  return url.startsWith("https")
    ? url.toLowerCase()
    : resolveSocialMediaLink(url, type);
};

function resolveSocialMediaLink(
  name: string,
  type: PlatformType | string,
): string {
  if (!Object.prototype.hasOwnProperty.call(PlatformType, type)) {
    return `https://web3.bio/?s=${name}`;
  }

  switch (type) {
    case PlatformType.url:
      return name.toLowerCase();
    case PlatformType.website:
      return `https://${name}`;
    case PlatformType.discord:
      return name.includes("https://")
        ? SocialPlatformMapping(type).urlPrefix + name
        : "";
    case PlatformType.lens:
      return (
        SocialPlatformMapping(PlatformType.lens).urlPrefix +
        name.replace(".lens", "")
      );
    default:
      const prefix = SocialPlatformMapping(type as PlatformType).urlPrefix;
      return prefix ? prefix + name : "";
  }
}

export const resolveEipAssetURL = async (
  source: string,
  identity?: string,
): Promise<string | null> => {
  if (!source) return null;
  const match = source?.match(regexEIP);
  if (match) {
    const [full, chainId, protocol, contractAddress, tokenId] = match;
    const network = chainIdToNetwork(Number(chainId));
    if (contractAddress && tokenId && network) {
      const fetchURL = `${SIMPLEHASH_URL}/api/v0/nfts/${network}/${contractAddress}/${tokenId}`;
      const res = await _fetcher(fetchURL);
      if (res?.nft_id) {
        return resolveMediaURL(res.image_url || res.previews?.image_large_url);
      } else {
        return null;
      }
    }
  }

  return resolveMediaURL(source, identity);
};

export const getLensDefaultAvatar = async (tokenId: number) => {
  try {
    const fetchURL = `${SIMPLEHASH_URL}/api/v0/nfts/polygon/0xdb46d1dc155634fbc732f92e853b10b288ad5a1d/${tokenId}`;
    const res = await fetch(fetchURL)
      .then((res) => res.json())
      .catch((e) => null);
    return res?.previews?.image_medium_url || res?.image_url;
  } catch (e) {
    return null;
  }
};
