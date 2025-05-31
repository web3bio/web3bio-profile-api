import { ARWEAVE_ASSET_PREFIX, OPENSEA_API_ENDPOINT } from "./utils";
import { isIPFS_Resource, resolveIPFS_URL } from "./ipfs";
import { chainIdToNetwork } from "./networks";
import { SocialPlatformMapping } from "./platform";
import { Platform } from "web3bio-profile-kit/types";
import { REGEX } from "web3bio-profile-kit/utils";

export const resolveMediaURL = (url: string, id?: string): string | null => {
  if (!url) return null;
  if (url.startsWith("data:") || url.startsWith("https://")) return url;
  if (url.startsWith("ar://"))
    return url.replace("ar://", ARWEAVE_ASSET_PREFIX);
  if (url.startsWith("ipfs://") || isIPFS_Resource(url))
    return resolveIPFS_URL(url) || url;
  return !id
    ? url
    : `https://api.web3.bio/avatar/svg/${encodeURIComponent(id)}`;
};

export const resolveHandle = (
  handle: string,
  platform?: Platform,
): string | null => {
  if (!handle) return null;
  if (platform === Platform.website) {
    return handle
      .replace(/^(?:https?:\/\/)?(?:www\.)?/i, "")
      .replace(/\/+$/g, "")
      .toLowerCase();
  }

  if (platform === Platform.youtube) {
    const match = handle.match(/@(.*?)(?=[\/]|$)/);
    return match ? match[0] : "";
  }

  if (REGEX.DOMAIN.test(handle)) {
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
  type: Platform | string,
): string | null => {
  if (!url) return null;
  const normalizedUrl = url.toLowerCase().replace(/\?$/, "");
  return normalizedUrl.startsWith("http")
    ? normalizedUrl
    : resolveSocialMediaLink(normalizedUrl, type);
};

function resolveSocialMediaLink(name: string, type: Platform | string): string {
  if (!(type in Platform)) {
    return `https://web3.bio/?s=${name}`;
  }

  switch (type) {
    case Platform.url:
      return name.toLowerCase();
    case Platform.website:
      return `https://${name}`;
    case Platform.discord:
      return name.includes("https://")
        ? SocialPlatformMapping(type).urlPrefix + name
        : "";
    case Platform.lens:
      return (
        SocialPlatformMapping(Platform.lens).urlPrefix +
        name.replace(/\.lens$/, "")
      );
    default:
      const prefix = SocialPlatformMapping(type as Platform).urlPrefix;
      return prefix ? prefix + name : "";
  }
}

export const resolveEipAssetURL = async (
  source: string | null,
): Promise<string | null> => {
  if (!source) return null;

  const match = source.match(REGEX.EIP);
  if (!match) return resolveMediaURL(source);

  const [full, chainId, protocol, contractAddress, tokenId] = match;

  if (!contractAddress || !tokenId) return resolveMediaURL(source);

  const network = chainIdToNetwork(Number(chainId));
  if (!network) return resolveMediaURL(source);

  try {
    const fetchURL = `${OPENSEA_API_ENDPOINT}/api/v2/chain/${network}/contract/${contractAddress}/nfts/${tokenId}`;
    const res = await fetch(fetchURL, {
      headers: {
        "x-api-key": process.env.OPENSEA_API_KEY || "",
      },
    });
    if (res.ok) {
      const nft = (await res.json())?.nft;
      return resolveMediaURL(nft?.image_url);
    }
  } catch (error) {
    console.error("Failed to fetch NFT data:", error);
  }

  return resolveMediaURL(source);
};
