import {
  errorHandle,
  formatText,
  isValidEthereumAddress,
  respondWithCache,
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
import { regexTwitterLink } from "@/utils/regexp";
import { recordsShouldFetch } from "@/app/api/profile/sns/[handle]/utils";
import { UDSocialAccountsList } from "@/app/api/profile/unstoppabledomains/[handle]/utils";

export const resolveIdentityResponse = async (
  handle: string,
  headers: AuthHeaders,
  platform: PlatformType,
  ns: boolean
) => {
  let identity = "";

  if (isValidEthereumAddress(handle)) {
    identity = handle.toLowerCase();
  } else {
    identity = handle;
  }
  const res = await queryIdentityGraph(
    identity,
    platform as PlatformType,
    GET_PROFILES(ns),
    headers
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
    if (isValidEthereumAddress(handle) || platform === PlatformType.sns) {
      const nsResponse = {
        address: handle,
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
      throw new Error(ErrorMessages.invalidResolved, { cause: 404 });
    }
  }
  return await generateProfileStruct(
    profile,
    ns,
    res.data.identity?.identityGraph?.edges
  );
};

export async function generateProfileStruct(
  data: ProfileRecord,
  ns?: boolean,
  edges?: IdentityGraphEdge[]
): Promise<ProfileAPIResponse | ProfileNSResponse> {
  const nsObj = {
    address: data.address,
    identity: data.identity,
    platform: data.platform,
    displayName: data.displayName,
    avatar: data.avatar
      ? await resolveEipAssetURL(data.avatar, data.identity)
      : data.platform === PlatformType.lens && data?.social?.uid
      ? await getLensDefaultAvatar(Number(data.social.uid))
      : null,
    description: data.description || null,
  };

  return ns
    ? nsObj
    : {
        ...nsObj,
        email: data.texts?.email || null,
        location: data.texts?.location || null,
        header: (await resolveEipAssetURL(data.texts?.header)) || null,
        contenthash: data.contenthash || null,
        links: generateSocialLinks(data, edges) || {},
        social: data.social
          ? {
              ...data.social,
              uid: isNaN(data.social.uid)
                ? data.social.uid
                : Number(data.social.uid),
            }
          : {},
      };
}

export const resolveIdentityRespond = async (
  handle: string,
  platform: PlatformType,
  headers: AuthHeaders,
  ns: boolean
) => {
  try {
    const json = (await resolveIdentityResponse(
      handle,
      headers,
      platform,
      ns
    )) as any;
    if (json.code) {
      return errorHandle({
        identity: handle,
        platform: platform,
        code: json.code,
        message: json.message,
      });
    }
    return respondWithCache(JSON.stringify(json));
  } catch (e: any) {
    return errorHandle({
      identity: handle,
      platform: platform,
      code: e.cause || 500,
      message: e.message,
    });
  }
};

export const generateSocialLinks = (
  data: ProfileRecord,
  edges?: IdentityGraphEdge[]
) => {
  const platform = data.platform;
  const texts = data.texts;
  const keys = texts ? Object.keys(texts) : [];
  const identity = data.identity;
  const res = {} as any;
  switch (platform) {
    case PlatformType.basenames:
    case PlatformType.ethereum:
    case PlatformType.linea:
    case PlatformType.ens:
      if (!texts) return {};
      let key = null;
      keys.forEach((i) => {
        key = Array.from(PLATFORM_DATA.keys()).find((k) =>
          PLATFORM_DATA.get(k)?.ensText?.includes(i.toLowerCase())
        );
        if (key && texts[i]) {
          res[key] = {
            link: getSocialMediaLink(texts[i], key),
            handle: resolveHandle(texts[i], key),
            sources: resolveVerifiedLink(`${key},${texts[i]}`, edges),
          };
        }
      });
      break;
    case PlatformType.farcaster:
      const resolvedHandle = resolveHandle(identity);
      res[PlatformType.farcaster] = {
        link: getSocialMediaLink(resolvedHandle!, PlatformType.farcaster),
        handle: resolvedHandle,
        sources: resolveVerifiedLink(
          `${PlatformType.farcaster},${resolvedHandle}`,
          edges
        ),
      };
      if (!data.description) break;
      const twitterMatch = data.description?.match(regexTwitterLink);
      if (twitterMatch) {
        const matched = twitterMatch[1];
        const resolveMatch =
          resolveHandle(matched, PlatformType.farcaster) || "";
        res[PlatformType.twitter] = {
          link: getSocialMediaLink(resolveMatch, PlatformType.twitter),
          handle: resolveMatch,
          sources: resolveVerifiedLink(
            `${PlatformType.twitter},${resolveMatch}`,
            edges
          ),
        };
      }
      break;
    case PlatformType.lens:
      const pureHandle = identity.replace(".lens", "");
      res[PlatformType.lens] = {
        link: getSocialMediaLink(pureHandle!, PlatformType.lens),
        handle: identity,
        sources: resolveVerifiedLink(
          `${PlatformType.lens},${pureHandle}.lens`,
          edges
        ),
      };
      keys?.forEach((i) => {
        if (Array.from(PLATFORM_DATA.keys()).includes(i as PlatformType)) {
          let key = null;
          key = Array.from(PLATFORM_DATA.keys()).find(
            (k) => k === i.toLowerCase()
          );
          if (key) {
            const resolvedHandle = resolveHandle(texts[i], i as PlatformType);
            res[key] = {
              link: getSocialMediaLink(texts[i], i),
              handle: resolvedHandle,
              sources: resolveVerifiedLink(`${key},${resolvedHandle}`, edges),
            };
          }
        }
      });
      break;
    case PlatformType.solana:
    case PlatformType.sns:
      recordsShouldFetch.forEach((x) => {
        const handle = resolveHandle(texts?.[x]);
        if (handle) {
          const type = ["CNAME", PlatformType.url].includes(x)
            ? PlatformType.website
            : x;
          res[type] = {
            link: getSocialMediaLink(handle, type)!,
            handle: handle,
            sources: resolveVerifiedLink(`${type},${handle}`, edges),
          };
        }
      });
      break;
    case PlatformType.unstoppableDomains:
      UDSocialAccountsList.forEach((x) => {
        const item = texts?.[x];
        if (item && PLATFORM_DATA.has(x)) {
          const resolvedHandle = resolveHandle(item, x);
          res[x] = {
            link: getSocialMediaLink(resolvedHandle, x),
            handle: resolvedHandle,
            sources: resolveVerifiedLink(`${x},${resolvedHandle}`, edges),
          };
        }
      });
      break;
    case PlatformType.sns:
    case PlatformType.solana:
      recordsShouldFetch.forEach((x) => {
        const handle = resolveHandle(texts[x]);
        if (handle) {
          const type = ["CNAME", PlatformType.url].includes(x)
            ? PlatformType.website
            : x;
          res[type] = {
            link: getSocialMediaLink(handle, type)!,
            handle: handle,
            sources: resolveVerifiedLink(`${type},${handle}`, edges),
          };
        }
      });
      break;
    case PlatformType.dotbit:
      keys.forEach((x) => {
        if (PLATFORM_DATA.has(x as PlatformType)) {
          const item = texts[x];
          const handle = resolveHandle(item, x as PlatformType);
          res[x] = {
            link: getSocialMediaLink(item, x as PlatformType)!,
            handle,
            sources: resolveVerifiedLink(`${x},${handle}`, edges),
          };
        }
      });
    default:
      break;
  }

  return res;
};
export const resolveVerifiedLink = (
  key: string,
  edges?: IdentityGraphEdge[]
) => {
  const res = [] as SourceType[];

  if (!edges?.length) return res;

  edges
    .filter((x) => x.target === key)
    .forEach((x) => {
      const source = x.dataSource.split(",")[0];
      if (!res.includes(source as SourceType)) res.push(source as SourceType);
    });
  return res;
};
