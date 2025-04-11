import { ARWEAVE_ASSET_PREFIX, OPENSEA_API_ENDPOINT } from "./base";
import { isIPFS_Resource, resolveIPFS_URL } from "./ipfs";
import { chainIdToNetwork } from "./networks";
import { PlatformType, SocialPlatformMapping } from "./platform";
import { regexDomain, regexEIP } from "./regexp";

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
  const normalizedUrl = url.toLowerCase().replace(/\?$/, "");
  return normalizedUrl.startsWith("http")
    ? normalizedUrl
    : resolveSocialMediaLink(normalizedUrl, type);
};

function resolveSocialMediaLink(
  name: string,
  type: PlatformType | string,
): string {
  if (!(type in PlatformType)) {
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
        name.replace(/\.lens$/, "")
      );
    default:
      const prefix = SocialPlatformMapping(type as PlatformType).urlPrefix;
      return prefix ? prefix + name : "";
  }
}

export const resolveEipAssetURL = async (
  source: string,
): Promise<string | null> => {
  if (!source) return null;

  const match = source.match(regexEIP);
  if (!match) return resolveMediaURL(source);

  const [full, chainId, protocol, contractAddress, tokenId] = match;

  if (!contractAddress || !tokenId) return resolveMediaURL(source);

  const network = chainIdToNetwork(Number(chainId));
  if (!network) return resolveMediaURL(source);

  try {
    const fetchURL = `${OPENSEA_API_ENDPOINT}/api/v2/chain/ethereum/contract/${contractAddress}/nfts/${tokenId}`;
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

export const getLensDefaultAvatar = async (tokenId: number) => {
  try {
    const fetchURL = `${OPENSEA_API_ENDPOINT}/api/v2/chain/matic/contract/0xdb46d1dc155634fbc732f92e853b10b288ad5a1d/nfts/${tokenId}`;
    const res = await fetch(fetchURL, {
      headers: {
        "x-api-key": process.env.OPENSEA_API_KEY || "",
      },
    });
    if (!res.ok) return null;
    const nft = (await res.json())?.nft;
    return resolveMediaURL(nft?.image_url);
  } catch (e) {
    return null;
  }
};
