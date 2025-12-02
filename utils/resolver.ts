import {
  getPlatform,
  getNetwork,
  REGEX,
  resolveMediaURL,
} from "web3bio-profile-kit/utils";
import { Network, Platform } from "web3bio-profile-kit/types";

export const resolveHandle = (
  handle: string,
  platform?: Platform,
): string | null => {
  if (!handle) return null;

  // Handle website platform
  if (platform === Platform.website) {
    return handle
      .replace(/^(?:https?:\/\/)?(?:www\.)?/i, "")
      .replace(/\/+$/, "")
      .toLowerCase();
  }

  // Handle YouTube platform
  if (platform === Platform.youtube) {
    const match = handle.match(/@([^\/]+)/);
    return match?.[0] ?? null;
  }

  // Handle domain-like handles
  if (REGEX.DOMAIN.test(handle)) {
    const segments = handle.split("/");
    const lastSegment = handle.endsWith("/")
      ? segments[segments.length - 2]
      : segments[segments.length - 1];

    return lastSegment?.replace(/^@/, "").split("?")[0].toLowerCase() ?? null;
  }

  // Default handle processing
  return handle.replace(/^@/, "").toLowerCase();
};

export const getSocialMediaLink = (
  url: string | null,
  type: Platform | string,
): string | null => {
  if (!url) return null;

  const normalizedUrl = url.toLowerCase().replace(/\?$/, "");

  return normalizedUrl.startsWith("http")
    ? normalizedUrl
    : resolveSocialLink(normalizedUrl, type);
};

const resolveSocialLink = (name: string, type: Platform | string): string => {
  if (!(type in Platform)) {
    return `https://web3.bio/?s=${encodeURIComponent(name)}`;
  }

  const platformType = type as Platform;

  switch (platformType) {
    case Platform.url:
      return name;

    case Platform.website:
      return `https://${name}`;

    case Platform.discord:
      return name.includes("https://")
        ? getPlatform(platformType).urlPrefix + name
        : "";

    case Platform.lens:
      return getPlatform(Platform.lens).urlPrefix + name.replace(/\.lens$/, "");

    default: {
      const platform = getPlatform(platformType);
      return platform?.urlPrefix ? platform.urlPrefix + name : "";
    }
  }
};

export const resolveEipAssetURL = async (
  source: string | null,
): Promise<string | null> => {
  if (!source) return null;

  const eipMatch = source.match(REGEX.EIP);
  if (!eipMatch) {
    return resolveMediaURL(source);
  }

  const [, chainId, , contractAddress, tokenId] = eipMatch;

  if (!contractAddress || !tokenId) {
    return resolveMediaURL(source);
  }

  const network = getNetwork(Number(chainId))?.key;
  if (!network) {
    return resolveMediaURL(source);
  }

  // Check API key availability early to avoid unnecessary processing
  const apiKey = process.env.ALCHEMY_NFT_API_KEY;
  if (!apiKey) {
    console.warn(
      "ALCHEMY_NFT_API_KEY not configured, falling back to source URL",
    );
    return resolveMediaURL(source);
  }
  const alchemyBase = getAlchemyBaseUrl(network as Network);
  try {
    const fetchURL = `https://${alchemyBase}-mainnet.g.alchemy.com/nft/v3/${process.env.ALCHEMY_NFT_API_KEY}/getNFTMetadata?contractAddress=${contractAddress}&tokenId=${tokenId}`;
    const response = await fetch(fetchURL);
    if (!response.ok) {
      console.warn(
        `OpenSea API request failed: ${response.status} ${response.statusText}`,
      );
      return resolveMediaURL(source);
    }

    const data = await response.json();
    const imageUrl =
      data?.image?.cachedUrl || data?.image?.pngUrl || data?.image?.originalUrl;

    return imageUrl ? resolveMediaURL(imageUrl) : resolveMediaURL(source);
  } catch (error) {
    console.error("Failed to fetch NFT data from Alchemy:", error);
    return resolveMediaURL(source);
  }
};

export const getAlchemyBaseUrl = (network: Network) => {
  if (network === Network.ethereum) return "eth";
  if (network === Network.optimism) return "opt";
  return network;
};
