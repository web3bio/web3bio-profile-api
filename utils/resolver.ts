import { NFTSCANFetcher, NFTSCAN_BASE_API_ENDPOINT } from "./fetcher";
import { resolveIPFS_URL } from "./ipfs";
import { PlatformType, SocialPlatformMapping } from "./platform";

export const resolveMediaURL = (url: string) => {
  const ArweaveAssetPrefix = "https://arweave.net/";
  if (!url) return null;
  return url.startsWith("data:") || url.startsWith("https:")
    ? url
    : url.startsWith("ar://")
    ? url.replaceAll("ar://", ArweaveAssetPrefix)
    : resolveIPFS_URL(url);
};

export const resolveHandle = (handle: string) => {
  const prefixHttps = "https://";
  const prefixHttp = "http://";
  const domainRegexp = /^(?:https?:\/\/)?(?:[^@\/\n]+@)?(?:www\.)?([^:\/\n]+)/;
  if (
    handle &&
    (handle.startsWith(prefixHttp) || handle.startsWith(prefixHttps))
  ) {
    return domainRegexp.exec(handle)![1].replaceAll("@", "");
  }
  return handle;
};

export const getSocialMediaLink = (url: string, type: PlatformType) => {
  let resolvedURL = "";
  if (!url) return null;
  if (url.startsWith("https")) {
    resolvedURL = url;
  } else {
    resolvedURL = resolveSocialMediaLink(url, type);
  }

  return resolvedURL;
};

export function resolveSocialMediaLink(name: string, type: PlatformType) {
  if (!Object.keys(PlatformType).includes(type))
    return `https://web5.bio/?s=${name}`;
  switch (type) {
    case PlatformType.url:
      return `${name}`;
    case PlatformType.website:
      return `https://${name}`;
    default:
      return SocialPlatformMapping(type).urlPrefix
        ? SocialPlatformMapping(type).urlPrefix + name
        : "";
  }
}

export const resolveEipAssetURL = async (source: string) => {
  if (!source) return null;
  const eipPrefix = "eip155:1/erc721:";
  if (source.startsWith(eipPrefix)) {
    const arr = source.split(eipPrefix)[1].split("/");
    const fetchURL =
      NFTSCAN_BASE_API_ENDPOINT +
      `assets/${arr[0]}/${arr[1]}?show_attribute=false`;
    const res = await NFTSCANFetcher(fetchURL);
    if (res && res.data) {
      return resolveMediaURL(res.data.image_uri || res.data.content_uri);
    }
  }
  return resolveMediaURL(source);
};
