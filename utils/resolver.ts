import { ArweaveAssetPrefix, SIMPLE_HASH_URL } from "./base";
import { _fetcher } from "./fetcher";
import { isIPFS_Resource, resolveIPFS_URL } from "./ipfs";
import { chainIdToNetwork } from "./networks";
import { PlatformType, SocialPlatformMapping } from "./platform";
import * as contentHash from "@ensdomains/content-hash";
import { regexDomain, regexEIP } from "./regexp";

export const resolveMediaURL = (url: string): string | null => {
  if (!url) return null;
  if (url.startsWith("data:") || url.startsWith("https:")) return url;
  if (url.startsWith("ar://")) return url.replace("ar://", ArweaveAssetPrefix);
  if (url.startsWith("ipfs://") || isIPFS_Resource(url))
    return resolveIPFS_URL(url);
  return url;
};

export const resolveHandle = (
  handle: string,
  platform?: PlatformType
): string | null => {
  if (!handle) return null;

  if (platform === PlatformType.website) {
    return handle.replace(/^https?:\/\//i, "").replace(/\/$/g, "");
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
    ).replace(/@/g, "");
  }

  return handle.replace(/@/g, "");
};

export const getSocialMediaLink = (
  url: string | null,
  type: PlatformType | string
): string | null => {
  if (!url) return null;
  return url.startsWith("https") ? url : resolveSocialMediaLink(url, type);
};

export function resolveSocialMediaLink(
  name: string,
  type: PlatformType | string
): string {
  if (!Object.prototype.hasOwnProperty.call(PlatformType, type)) {
    return `https://web3.bio/?s=${name}`;
  }

  switch (type) {
    case PlatformType.url:
      return name;
    case PlatformType.website:
      return `https://${name}`;
    case PlatformType.discord:
      return name.includes("https://")
        ? SocialPlatformMapping(type).urlPrefix + name
        : "";
    default:
      const prefix = SocialPlatformMapping(type as PlatformType).urlPrefix;
      return prefix ? prefix + name : "";
  }
}

export const resolveEipAssetURL = async (
  source: string
): Promise<string | null> => {
  if (!source) return null;

  const match = source.match(regexEIP);
  if (match) {
    const [full, chainId, protocol, contractAddress, tokenId] = match;
    const network = chainIdToNetwork(chainId);

    if (contractAddress && tokenId && network) {
      try {
        const fetchURL = `${SIMPLE_HASH_URL}/api/v0/nfts/${network}/${contractAddress}/${tokenId}`;
        const res = await _fetcher(fetchURL);
        if (res?.nft_id) {
          return resolveMediaURL(
            res.image_url || res.previews?.image_large_url
          );
        }
      } catch (e) {
        console.error("Error fetching NFT data:", e);
      }
    }
  }

  return resolveMediaURL(source);
};

export const decodeContenthash = (encoded: string) => {
  if (
    !encoded ||
    ["0x", "0x0000000000000000000000000000000000000000"].includes(encoded)
  ) {
    return null;
  }

  try {
    const codec = contentHash.getCodec(encoded);
    const decodedId = contentHash.decode(encoded);
    return `${codec}://${decodedId}`;
  } catch (e) {
    return null;
  }
};
