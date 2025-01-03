import { formatText, isValidEthereumAddress } from "@/utils/base";
import {
  getSocialMediaLink,
  resolveEipAssetURL,
  resolveHandle,
} from "@/utils/resolver";
import { PLATFORM_DATA, PlatformType } from "@/utils/platform";
import { regexEns } from "@/utils/regexp";
import { AuthHeaders, ErrorMessages, IdentityGraphEdge } from "@/utils/types";
import { GET_PROFILES, queryIdentityGraph } from "@/utils/query";
import { resolveVerifiedLink } from "../../[handle]/utils";

export const resolveENSResponse = async (
  handle: string,
  headers: AuthHeaders,
  _platform?: PlatformType,
  ns?: boolean
) => {
  let identity,
    platform = "";

  if (isValidEthereumAddress(handle)) {
    identity = handle.toLowerCase();
    platform = _platform || PlatformType.ethereum;
  } else {
    if (!regexEns.test(handle))
      throw new Error(ErrorMessages.invalidIdentity, { cause: 404 });
    identity = handle;
    platform = _platform || PlatformType.ens;
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
      platform: _platform || PlatformType.ethereum,
      message: res.msg,
      code: res.code,
    };
  }

  const profile = res?.data?.identity?.profile;
  if (!profile) {
    if (isValidEthereumAddress(handle)) {
      return {
        address: handle,
        identity: handle,
        platform: _platform || PlatformType.ethereum,
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
      throw new Error(ErrorMessages.invalidResolved, { cause: 404 });
    }
  }
  const linksObj = await getLinks(
    profile.texts,
    res.data.identity.identityGraph?.edges
  );
  return {
    address: isValidEthereumAddress(profile.identity)
      ? profile.identity.toLowerCase()
      : profile.address?.toLowerCase(),
    identity: profile.identity,
    platform:
      _platform || isValidEthereumAddress(profile.identity)
        ? PlatformType.ethereum
        : PlatformType.ens,
    displayName: profile.displayName || handle,
    avatar: await resolveEipAssetURL(profile.avatar, profile.identity),
    description: profile.description,
    email: profile.texts?.email,
    location: profile.texts?.location,
    header: await resolveEipAssetURL(
      profile.texts?.header || profile.texts?.banner
    ),
    contenthash: profile.contenthash,
    links: linksObj,
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
