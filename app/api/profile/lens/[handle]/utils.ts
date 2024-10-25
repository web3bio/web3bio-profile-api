import {
  getSocialMediaLink,
  resolveEipAssetURL,
  resolveHandle,
} from "@/utils/resolver";
import { LENS_PROTOCOL_PROFILE_CONTRACT_ADDRESS } from "@/utils/base";
import { PLATFORM_DATA, PlatformType } from "@/utils/platform";
import { ErrorMessages } from "@/utils/types";
import { queryIdentityGraph } from "@/utils/query";

export const resolveLensHandle = async (handle: string) => {
  const response = await queryIdentityGraph(handle, PlatformType.lens);
  const profile = response?.data?.identity?.profile;

  if (!profile) throw new Error(ErrorMessages.notFound, { cause: 404 });

  const pureHandle = profile.identity.split(".lens")[0];
  let linksObj = {
    [PlatformType.lens]: {
      link: getSocialMediaLink(pureHandle, PlatformType.lens),
      handle: pureHandle,
    },
  } as any;
  if (profile.texts) {
    const keys = Object.keys(profile.texts);
    keys.forEach((i) => {
      if (Array.from(PLATFORM_DATA.keys()).includes(i as PlatformType)) {
        let key = null;
        key = Array.from(PLATFORM_DATA.keys()).find(
          (k) => k === i.toLowerCase()
        );
        if (key) {
          linksObj[key] = {
            link: getSocialMediaLink(profile.texts[i], i),
            handle: resolveHandle(profile.texts[i]),
          };
        }
      }
    });
  }

  const avatarUri =
    profile.avatar ||
    (await resolveEipAssetURL(
      `eip155:137/erc721:${LENS_PROTOCOL_PROFILE_CONTRACT_ADDRESS}/${profile.social.uid}`
    ));
  const resJSON = {
    address: profile.address,
    identity: profile.identity,
    platform: PlatformType.lens,
    displayName: profile.displayName || profile.identity,
    avatar: await resolveEipAssetURL(avatarUri),
    email: profile.texts?.email || null,
    description: profile.description,
    location: profile.texts?.location || null,
    header: await resolveEipAssetURL(
      profile.texts?.header || profile.texts?.banner
    ),
    contenthash: null,
    links: linksObj,
    social: {
      ...profile.social,
      uid: Number(profile?.social?.uid),
    },
  };
  return resJSON;
};
