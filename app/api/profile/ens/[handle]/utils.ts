import { isValidEthereumAddress } from "@/utils/base";
import {
  getSocialMediaLink,
  resolveEipAssetURL,
  resolveHandle,
} from "@/utils/resolver";
import { PLATFORM_DATA, PlatformType } from "@/utils/platform";
import { regexEns } from "@/utils/regexp";
import { ErrorMessages } from "@/utils/types";
import { GET_PROFILES, queryIdentityGraph } from "@/utils/query";

export const resolveENSResponse = async (handle: string) => {
  let identity,
    platform = "";

  if (isValidEthereumAddress(handle)) {
    identity = handle.toLowerCase();
    platform = PlatformType.ethereum;
  } else {
    if (!regexEns.test(handle))
      throw new Error(ErrorMessages.invalidIdentity, { cause: 404 });
    identity = handle;
    platform = PlatformType.ens;
  }

  const res = await queryIdentityGraph(
    identity,
    platform as PlatformType,
    GET_PROFILES(true)
  );
  const profile = res?.data?.identity?.profile;
  if (!profile) {
    return {
      address: res.data.identity.identity,
      identity: res.data.identity.identity,
      platform: PlatformType.ethereum,
      displayName: null,
      avatar: null,
      description: null,
      email: null,
      location: null,
      header: null,
      contenthash: null,
      links: {},
      social: {},
    };
  }
  const linksObj = await getLinks(profile.texts);
  return {
    address: profile.address.toLowerCase(),
    identity: profile.identity,
    platform: PlatformType.ens,
    displayName: profile.displayName || handle,
    avatar: await resolveEipAssetURL(profile.avatar),
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

const getLinks = async (texts: any) => {
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
        handle: resolveHandle(texts[i]),
      };
    }
  });
  return res;
};
