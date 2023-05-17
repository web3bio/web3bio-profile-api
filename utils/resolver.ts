import { SIMPLE_HASH_URL, _fetcher } from "./fetcher";
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
  if (!handle) return null;
  const prefixHttps = "https://";
  const prefixHttp = "http://";
  const domainRegexp = /^(?:https?:\/\/)?(?:[^@\/\n]+@)?(?:www\.)?([^:\/\n]+)/;
  if (
    handle &&
    (handle.startsWith(prefixHttp) || handle.startsWith(prefixHttps))
  ) {
    return domainRegexp.exec(handle)![1].replaceAll("@", "");
  }
  return handle.replaceAll("@", "");
};

export const getSocialMediaLink = (url: string | null, type: PlatformType) => {
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
  try {
    const eipPrefix = "eip155:1";
    if (source.startsWith(eipPrefix)) {
      const arr = source.split(eipPrefix)[1].split(":")[1].split("/");
      const fetchURL =
        SIMPLE_HASH_URL + `/api/v0/nfts/ethereum/${arr[0]}/${arr[1]}`;
      const res = await _fetcher(fetchURL);

      if (res || res.nft_id) {
        return resolveMediaURL(res.image_url || res.previews?.image_large_url);
      }
    }
    return resolveMediaURL(source);
  } catch (e) {
    return null;
  }
};
