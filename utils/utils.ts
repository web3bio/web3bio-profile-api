import {
  errorHandle,
  formatText,
  isValidEthereumAddress,
  respondWithCache,
} from "@/utils/base";
import {
  getSocialMediaLink,
  resolveEipAssetURL,
  resolveHandle,
} from "@/utils/resolver";
import { PLATFORM_DATA, PlatformType } from "@/utils/platform";
import { AuthHeaders, ErrorMessages, IdentityGraphEdge } from "@/utils/types";
import { GET_PROFILES, queryIdentityGraph } from "@/utils/query";
import { SourceType } from "./source";

export const resolveEtherResponse = async (
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
    if (isValidEthereumAddress(handle)) {
      if (platform === PlatformType.ens) {
        return {
          address: handle,
          identity: handle,
          platform: PlatformType.ethereum,
          displayName: formatText(handle),
          avatar: null,
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
    } else {
      throw new Error(ErrorMessages.invalidResolved, { cause: 404 });
    }
  }
  const nsResponse = {
    address: isValidEthereumAddress(profile.identity)
      ? profile.identity.toLowerCase()
      : profile.address?.toLowerCase(),
    identity: profile.identity,
    platform: platform,
    displayName: profile.displayName || handle,
    avatar: await resolveEipAssetURL(profile.avatar, profile.identity),
    description: profile.description,
  };
  return ns
    ? nsResponse
    : {
        ...nsResponse,
        email: profile.texts?.email,
        location: profile.texts?.location,
        header: await resolveEipAssetURL(
          profile.texts?.header || profile.texts?.banner
        ),
        contenthash: profile.contenthash,
        links: await getLinks(
          profile.texts,
          res.data.identity.identityGraph?.edges
        ),
        social: {},
      };
};

const getLinks = async (texts: any, edges: IdentityGraphEdge[]) => {
  if (!texts) return {};
  const keys = Object.keys(texts);
  let key = null;
  let res = {} as any;
  keys.forEach((i) => {
    key = Array.from(PLATFORM_DATA.keys()).find((k) =>
      PLATFORM_DATA.get(k)?.ensText?.includes(i.toLowerCase())
    );
    if (key) {
      res[key] = {
        link: getSocialMediaLink(texts[i], key),
        handle: resolveHandle(texts[i], key),
        sources: resolveVerifiedLink(`${key},${texts[i]}`, edges),
      };
    }
  });
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

export const resolveEtherRespond = async (
  handle: string,
  headers: AuthHeaders,
  platform: PlatformType,
  ns: boolean
) => {
  try {
    const json = (await resolveEtherResponse(
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
