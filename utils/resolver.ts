import { SIMPLE_HASH_URL, _fetcher } from "./fetcher";
import { resolveIPFS_URL } from "./ipfs";
import { PlatformType } from "./platform";
import { SocialPlatformMapping } from "./utils";

const domainRegexp = /^(?:https?:\/\/)?(?:[^@\/\n]+@)?(?:www\.)?([^:\/\n]+)/;

export const resolveMediaURL = (url: string) => {
  const ArweaveAssetPrefix = "https://arweave.net/";
  if (!url) return null;
  return url.startsWith("data:") || url.startsWith("https:")
    ? url
    : url.startsWith("ar://")
    ? url.replaceAll("ar://", ArweaveAssetPrefix)
    : resolveIPFS_URL(url);
};

export const resolveHandle = (handle: string, platform?: PlatformType) => {
  if (!handle) return null;
  if (platform && platform === PlatformType.website)
    return handle.replace(/http(s?):\/\//g, "").replace(/\/$/g, "");
  if (platform && platform === PlatformType.youtube)
    // match youtube user handle regex
    return handle.match(/@(.*?)(?=[/]|$)/)?.[0] || "";
  if (handle && domainRegexp.test(handle)) {
    const arr = handle.split("/");
    return (
      handle.endsWith("/") ? arr[arr.length - 2] : arr[arr.length - 1]
    ).replaceAll("@", "");
  }
  return handle.replaceAll("@", "");
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
      if (!name.includes("#"))
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
