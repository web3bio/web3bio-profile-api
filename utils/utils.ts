import {
  errorHandle,
  formatText,
  handleSearchPlatform,
  isValidEthereumAddress,
  isWeb3Address,
  prettify,
  respondWithCache,
  shouldPlatformFetch,
} from "@/utils/base";
import {
  getLensDefaultAvatar,
  getSocialMediaLink,
  resolveEipAssetURL,
  resolveHandle,
} from "@/utils/resolver";
import { PLATFORM_DATA, PlatformType } from "@/utils/platform";
import {
  AuthHeaders,
  ErrorMessages,
  IdentityGraphEdge,
  ProfileAPIResponse,
  ProfileNSResponse,
  ProfileRecord,
} from "@/utils/types";
import { GET_PROFILES, queryIdentityGraph } from "@/utils/query";
import { SourceType } from "./source";
import { regexLowercaseExempt } from "@/utils/regexp";

const UD_ACCOUNTS_LIST = [
  PlatformType.twitter,
  PlatformType.discord,
  PlatformType.reddit,
  PlatformType.lens,
  PlatformType.telegram,
  PlatformType.youtube,
  PlatformType.website,
  PlatformType.url,
];
const SNS_RECORDS_LIST = [
  PlatformType.twitter,
  PlatformType.telegram,
  PlatformType.reddit,
  PlatformType.url,
  PlatformType.github,
  PlatformType.discord,
  "CNAME",
];

const SnsSDKProxyEndpoint = "https://sns-sdk-proxy.bonfida.workers.dev/";

export const resolveContentIPNS = async (handle: string) => {
  const res = await fetch(SnsSDKProxyEndpoint + "domain-data/" + handle)
    .then((res) => res.json())
    .catch(() => null);
  if (!res || res?.s === "error") return "";
  const ipnsMatch = Buffer.from(res?.result, "base64")
    .toString("utf-8")
    .match(/ipns=(k51[a-zA-Z0-9]{59})/);
  return ipnsMatch ? "ipns://" + ipnsMatch[1] : null;
};

export const resolveIdentityResponse = async (
  handle: string,
  platform: PlatformType,
  headers: AuthHeaders,
  ns: boolean,
) => {
  const res = await queryIdentityGraph(
    GET_PROFILES,
    handle,
    platform as PlatformType,
    headers,
  );
  if (res.msg) {
    return {
      identity: handle,
      platform: platform,
      message: res.msg,
      code: res.code,
    };
  }

  const profile = res?.data?.identity?.profile;
  // ens empty resolved address
  if (!profile) {
    let nsResponse = null;
    if ([PlatformType.sns, PlatformType.ens].includes(platform)) {
      if (platform === PlatformType.ens && !isValidEthereumAddress(handle))
        throw new Error(ErrorMessages.invalidResolved, { cause: 404 });
      nsResponse = {
        address: isWeb3Address(handle) ? handle : null,
        identity: handle,
        platform:
          platform === PlatformType.ens
            ? PlatformType.ethereum
            : PlatformType.solana,
        displayName: formatText(handle),
        avatar: null,
      };
      return ns
        ? nsResponse
        : {
            ...nsResponse,
            description: null,
            email: null,
            location: null,
            header: null,
            contenthash: null,
            links: {},
            social: {},
          };
    } else {
      throw new Error(ErrorMessages.notFound, { cause: 404 });
    }
  }
  return await generateProfileStruct(
    profile,
    ns,
    res.data.identity?.identityGraph?.edges,
  );
};

export async function generateProfileStruct(
  data: ProfileRecord,
  ns?: boolean,
  edges?: IdentityGraphEdge[],
): Promise<ProfileAPIResponse | ProfileNSResponse> {
  const nsObj = {
    address: data.address,
    identity: data.identity,
    platform: data.platform,
    displayName: data.displayName,
    avatar: data.avatar
      ? await resolveEipAssetURL(data.avatar)
      : data.platform === PlatformType.lens && data?.social?.uid
        ? await getLensDefaultAvatar(Number(data.social.uid))
        : null,
    description: data.description || null,
  };
  const { links, contenthash } = await generateSocialLinks(data, edges);
  return ns
    ? nsObj
    : {
        ...nsObj,
        email: data.texts?.email || null,
        location: data.texts?.location || null,
        header: (await resolveEipAssetURL(data.texts?.header)) || null,
        contenthash: contenthash || null,
        links: links || {},
        social: data.social
          ? {
              uid: data.social.uid ? Number(data.social.uid) : null,
              follower: Number(data.social.follower),
              following: Number(data.social.following),
            }
          : {},
      };
}

export const resolveIdentityHandle = async (
  handle: string,
  platform: PlatformType,
  headers: AuthHeaders,
  ns: boolean = false,
) => {
  try {
    const response = await resolveIdentityResponse(
      handle,
      platform,
      headers,
      ns,
    );
    if ("code" in response) {
      return errorHandle({
        identity: handle,
        platform,
        code: response.code,
        message: response.message,
      });
    }
    return respondWithCache(JSON.stringify(response));
  } catch (e: any) {
    return errorHandle({
      identity: handle,
      platform: platform,
      code: e.cause || 500,
      message: e.message,
    });
  }
};

export const generateSocialLinks = async (
  data: ProfileRecord,
  edges?: IdentityGraphEdge[],
) => {
  const platform = data.platform;
  const texts = data.texts;
  const keys = texts ? Object.keys(texts) : [];
  const identity = data.identity;
  let links = {} as any;
  let contenthash = null;
  switch (platform) {
    case PlatformType.basenames:
    case PlatformType.ethereum:
    case PlatformType.linea:
    case PlatformType.ens:
      if (!texts) break;
      let key = null;
      keys.forEach((i) => {
        key = Array.from(PLATFORM_DATA.keys()).find((k) =>
          PLATFORM_DATA.get(k)?.ensText?.includes(i.toLowerCase()),
        );
        const resolvedHandle = resolveHandle(texts[i], key);
        if (key && resolvedHandle) {
          links[key] = {
            link: getSocialMediaLink(resolvedHandle, key),
            handle: resolvedHandle,
            sources: resolveVerifiedLink(`${key},${resolvedHandle}`, edges),
          };
        }
      });
      contenthash = data.contenthash;
      break;
    case PlatformType.farcaster:
      contenthash = data.contenthash;
      links[PlatformType.farcaster] = {
        link: getSocialMediaLink(identity, PlatformType.farcaster),
        handle: identity,
        sources: resolveVerifiedLink(
          `${PlatformType.farcaster},${identity}`,
          edges,
        ),
      };
      if (texts?.twitter) {
        const resolvedHandle = resolveHandle(texts.twitter);
        links[PlatformType.twitter] = {
          link: getSocialMediaLink(resolvedHandle, PlatformType.twitter),
          handle: resolvedHandle,
          sources: resolveVerifiedLink(
            `${PlatformType.twitter},${resolvedHandle}`,
            edges,
          ),
        };
      }
      break;
    case PlatformType.lens:
      contenthash = data.contenthash;
      const pureHandle = identity.replace(".lens", "");
      links[PlatformType.lens] = {
        link: getSocialMediaLink(pureHandle, PlatformType.lens),
        handle: identity,
        sources: resolveVerifiedLink(`${PlatformType.lens},${identity}`, edges),
      };
      keys?.forEach((i) => {
        if (Array.from(PLATFORM_DATA.keys()).includes(i as PlatformType)) {
          let key = null;
          key = Array.from(PLATFORM_DATA.keys()).find(
            (k) => k === i.toLowerCase(),
          );
          if (key) {
            const resolvedHandle = resolveHandle(texts[i], i as PlatformType);
            links[key] = {
              link: getSocialMediaLink(resolvedHandle, i),
              handle: resolvedHandle,
              sources: resolveVerifiedLink(`${key},${resolvedHandle}`, edges),
            };
          }
        }
      });
      break;
    case PlatformType.solana:
    case PlatformType.sns:
      contenthash =
        data.texts?.["IPNS"] ||
        data.texts?.["IPFS"] ||
        (await resolveContentIPNS(data.identity));
      SNS_RECORDS_LIST.forEach((x) => {
        const handle = resolveHandle(texts?.[x]);
        if (handle) {
          const type = ["CNAME", PlatformType.url].includes(x)
            ? PlatformType.website
            : x;
          links[type] = {
            link: getSocialMediaLink(handle, type)!,
            handle: handle,
            sources: resolveVerifiedLink(`${type},${handle}`, edges),
          };
        }
      });
      break;
    case PlatformType.unstoppableDomains:
      contenthash = data.contenthash;
      UD_ACCOUNTS_LIST.forEach((x) => {
        const item = texts?.[x];
        if (item && PLATFORM_DATA.has(x)) {
          const resolvedHandle = resolveHandle(item, x);
          links[x] = {
            link: getSocialMediaLink(resolvedHandle, x),
            handle: resolvedHandle,
            sources: resolveVerifiedLink(`${x},${resolvedHandle}`, edges),
          };
        }
      });
      break;
    case PlatformType.dotbit:
      contenthash = data.contenthash;
      keys.forEach((x) => {
        if (PLATFORM_DATA.has(x as PlatformType)) {
          const item = texts[x];
          const resolvedHandle = resolveHandle(item, x as PlatformType);
          links[x] = {
            link: getSocialMediaLink(item, x as PlatformType)!,
            handle: resolvedHandle,
            sources: resolveVerifiedLink(`${x},${resolvedHandle}`, edges),
          };
        }
      });
    default:
      break;
  }

  return { links, contenthash };
};

export const resolveVerifiedLink = (
  key: string,
  edges?: IdentityGraphEdge[],
) => {
  const res = [] as SourceType[];
  if (!edges?.length) return res;
  edges
    .filter((x) => x.target === key)
    .forEach((x) => {
      const source = x.dataSource;
      if (!res.includes(source as SourceType)) res.push(source as SourceType);
    });
  return res;
};

// Resolves and normalizes a user identity string into a standardized format.
export const resolveIdentity = (input: string): string | null => {
  if (!input) return null;

  const parts = input.split(",");

  let platform: PlatformType;
  let identity: string;

  if (parts.length === 2) {
    [platform, identity] = parts as [PlatformType, string];
    identity = prettify(identity);
  } else if (parts.length === 1) {
    platform = handleSearchPlatform(input);
    identity = prettify(input);
  } else {
    return null;
  }

  if (!shouldPlatformFetch(platform) || !identity) return null;

  const normalizedIdentity = regexLowercaseExempt.test(identity)
    ? identity
    : identity.toLowerCase();

  return `${platform},${normalizedIdentity}`;
};

export const resolveIdentityBatch = (input: string[]): string[] => {
  const results: string[] = [];

  for (const id of input) {
    const processed = resolveIdentity(id);
    if (processed) {
      results.push(processed);
    }
  }
  return results;
};
