import { SIMPLE_HASH_URL, _fetcher } from "./fetcher";
import { isIPFS_Resource, resolveIPFS_URL } from "./ipfs";
import { chainIdToNetwork } from "./networks";
import { PlatformType } from "./platform";
import { SocialPlatformMapping } from "./utils";

const ArweaveAssetPrefix = "https://arweave.net/";
const eipRegexp = /^eip155:(\d+)\/(erc1155|erc721):(.*)\/(.*)$/;
const domainRegexp = /^(?:https?:\/\/)?(?:[^@\/\n]+@)?(?:www\.)?([^:\/\n]+)/;

export const resolveMediaURL = (url: string) => {
  if (!url) return null;
  switch (!!url) {
    case url.startsWith("data:") || url.startsWith("https:"):
      return url;
    case url.startsWith("ar://"):
      return url.replaceAll("ar://", ArweaveAssetPrefix);
    case url.startsWith("ipfs://") || isIPFS_Resource(url):
      return resolveIPFS_URL(url);
    default:
      return url;
  }
};

export const resolveHandle = (handle: string, platform?: PlatformType) => {
  if (!handle) return null;
  let handleToResolve = handle;
  if (platform === PlatformType.website)
    return handle.replace(/http(s?):\/\//g, "").replace(/\/$/g, "");
  if (platform === PlatformType.youtube)
    return handle.match(/@(.*?)(?=[\/]|$)/)?.[0] || "";
  if (
    platform &&
    [PlatformType.lens, PlatformType.hey, PlatformType.lenster].includes(
      platform
    ) &&
    handle.endsWith(".lens")
  )
    handleToResolve = handle.replace(".lens", "");
  if (domainRegexp.test(handleToResolve)) {
    const arr = handleToResolve.split("/");
    return (
      handleToResolve.endsWith("/") ? arr[arr.length - 2] : arr[arr.length - 1]
    ).replaceAll("@", "");
  }

  return handleToResolve.replaceAll("@", "");
};

export const getSocialMediaLink = (
  url: string | null,
  type: PlatformType | string
) => {
  let resolvedURL = "";
  if (!url) return null;
  if (url.startsWith("https")) {
    resolvedURL = url;
  } else {
    resolvedURL = resolveSocialMediaLink(url, type);
  }

  return resolvedURL;
};

export function resolveSocialMediaLink(
  name: string,
  type: PlatformType | string
) {
  if (!Object.keys(PlatformType).includes(type))
    return `https://web3.bio/?s=${name}`;
  switch (type) {
    case PlatformType.url:
      return `${name}`;
    case PlatformType.website:
      return `https://${name}`;
    case PlatformType.discord:
      if (name.includes("https://"))
        return SocialPlatformMapping(type).urlPrefix + name;
      return "";
    default:
      return SocialPlatformMapping(type as PlatformType).urlPrefix
        ? SocialPlatformMapping(type as PlatformType).urlPrefix + name
        : "";
  }
}

export const resolveEipAssetURL = async (source: string) => {
  if (!source) return null;
  try {
    if (eipRegexp.test(source)) {
      const match = source.match(eipRegexp);
      const chainId = match?.[1];
      const contractAddress = match?.[3];
      const tokenId = match?.[4];
      const network = chainIdToNetwork(chainId);
      
      if (contractAddress && tokenId && network) {
        const fetchURL =
          SIMPLE_HASH_URL +
          `/api/v0/nfts/${network}/${contractAddress}/${tokenId}`;
        const res = await _fetcher(fetchURL);

        if (res || res.nft_id) {
          return resolveMediaURL(
            res.image_url || res.previews?.image_large_url
          );
        }
      }
    }
    return resolveMediaURL(source);
  } catch (e) {
    return null;
  }
};