import {
  getSocialMediaLink,
  resolveEipAssetURL,
  resolveHandle,
} from "@/utils/resolver";
import { PLATFORM_DATA, PlatformType } from "@/utils/platform";
import { ErrorMessages } from "@/utils/types";
import { GET_PROFILES, queryIdentityGraph } from "@/utils/query";
import { LENS_PROTOCOL_PROFILE_CONTRACT_ADDRESS } from "@/utils/base";
import { resolveVerifiedLink } from "../../[handle]/utils";

export const resolveLensHandle = async (handle: string, ns?: boolean) => {
  const response = await queryIdentityGraph(
    handle,
    PlatformType.lens,
    GET_PROFILES(ns)
  );
  const profile = response?.data?.identity?.profile;

  if (!profile) throw new Error(ErrorMessages.notFound, { cause: 404 });

  const pureHandle = profile.identity.split(".lens")[0];
  let linksObj = {
    [PlatformType.lens]: {
      link: getSocialMediaLink(pureHandle, PlatformType.lens),
      handle: pureHandle,
      sources: resolveVerifiedLink(
        `${PlatformType.lens},${profile.identity}`,
        response.data.identity.identityGraph?.edges
      ),
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
          const resolvedHandle = resolveHandle(profile.texts[i]);
          linksObj[key] = {
            link: getSocialMediaLink(profile.texts[i], i),
            handle: resolvedHandle,
            sources: resolveVerifiedLink(
              resolvedHandle || "",
              response.data.identity.identityGraph?.edges
            ),
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
