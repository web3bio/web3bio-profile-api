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
  const normalizedHandle = handle?.trim();
  if (!normalizedHandle) return null;

  // Handle website platform
  if (platform === Platform.website) {
    return normalizedHandle
      .replace(/^(?:https?:\/\/)?(?:www\.)?/i, "")
      .replace(/\/+$/, "")
      .toLowerCase();
  }

  // Handle YouTube platform
  if (platform === Platform.youtube) {
    const match = normalizedHandle.match(/@([^\/]+)/);
    return match?.[0] ?? null;
  }

  // Handle domain-like handles
  if (REGEX.DOMAIN.test(normalizedHandle)) {
    const segments = normalizedHandle.split("/");
    const lastSegment = normalizedHandle.endsWith("/")
      ? segments[segments.length - 2]
      : segments[segments.length - 1];

    return lastSegment?.replace(/^@/, "").split("?")[0].toLowerCase() ?? null;
  }

  // Default handle processing
  return normalizedHandle.replace(/^@/, "").toLowerCase();
};

export const getSocialMediaLink = (
  url: string | null,
  type: Platform | string,
): string | null => {
  const trimmed = url?.trim();
  if (!trimmed) return null;

  const lowered = trimmed.toLowerCase();
  const normalizedUrl = lowered.endsWith("?") ? lowered.slice(0, -1) : lowered;

  return normalizedUrl.startsWith("http")
    ? normalizedUrl
    : resolveSocialLink(normalizedUrl, type);
};

const resolveSocialLink = (name: string, type: Platform | string): string => {
  if (!(type in Platform)) {
    return `https://web3.bio/?s=${encodeURIComponent(name)}`;
  }

  const platformType = type as Platform;
  const platform = getPlatform(platformType);

  switch (platformType) {
    case Platform.url:
      return name;

    case Platform.website:
      return `https://${name}`;

    case Platform.discord:
      if (name.startsWith("http")) return name;
      return platform?.urlPrefix ? platform.urlPrefix + name : "";

    case Platform.lens:
      return platform?.urlPrefix
        ? platform.urlPrefix + name.replace(/\.lens$/, "")
        : "";

    default: {
      return platform?.urlPrefix ? platform.urlPrefix + name : "";
    }
  }
};

export const resolveEipAssetURL = async (
  source: string | null,
): Promise<string | null> => {
  const normalized = source?.trim();
  if (!normalized) return null;

  const eipMatch = normalized.match(REGEX.EIP);
  if (!eipMatch) {
    return resolveMediaURL(normalized);
  }

  const [, chainId, , contractAddress, tokenId] = eipMatch;

  if (!contractAddress || !tokenId) {
    return resolveMediaURL(normalized);
  }

  const network = getNetwork(Number(chainId))?.key;
  if (!network) {
    return resolveMediaURL(normalized);
  }

  // Try OpenSea first
  const openseaApiKey = process.env.OPENSEA_API_KEY;
  if (openseaApiKey) {
    try {
      const fetchURL = `https://api.opensea.io/api/v2/chain/${network}/contract/${contractAddress}/nfts/${tokenId}`;
      const response = await fetch(fetchURL, {
        headers: { "x-api-key": openseaApiKey },
      });
      if (response.ok) {
        const data = await response.json();
        const imageUrl = data?.nft?.image_url;
        if (imageUrl) {
          return resolveMediaURL(imageUrl);
        }
      }
    } catch (error) {
      console.error("Failed to fetch NFT data from OpenSea:", error);
    }
  }

  // Fallback to Alchemy
  const alchemyApiKey = process.env.ALCHEMY_NFT_API_KEY;
  if (alchemyApiKey) {
    const alchemyBase = getAlchemyBaseUrl(network as Network);
    try {
      const fetchURL = `https://${alchemyBase}-mainnet.g.alchemy.com/nft/v3/${alchemyApiKey}/getNFTMetadata?contractAddress=${contractAddress}&tokenId=${tokenId}`;
      const response = await fetch(fetchURL);
      if (response.ok) {
        const data = await response.json();
        const imageUrl =
          data?.image?.cachedUrl ||
          data?.image?.pngUrl ||
          data?.image?.originalUrl;
        if (imageUrl) {
          return resolveMediaURL(imageUrl);
        }
      }
    } catch (error) {
      console.error("Failed to fetch NFT data from Alchemy:", error);
    }
  }

  // Final fallback
  return resolveMediaURL(normalized);
};

export const getAlchemyBaseUrl = (network: Network) => {
  if (network === Network.ethereum) return "eth";
  if (network === Network.optimism) return "opt";
  if (network === Network.polygon) return "polygon";
  if (network === Network.arbitrum) return "arb";
  if (network === Network.base) return "base";
  return network;
};
