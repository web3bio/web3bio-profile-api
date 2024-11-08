import { PlatformType } from "@/utils/platform";
import { resolveIPFS_URL } from "@/utils/ipfs";
import { getSocialMediaLink, resolveHandle } from "@/utils/resolver";
import { GET_PROFILES, queryIdentityGraph } from "@/utils/query";
import { ErrorMessages } from "@/utils/types";
import { formatText } from "@/utils/base";
import { regexSolana } from "@/utils/regexp";

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

const recordsShouldFetch = [
  PlatformType.twitter,
  PlatformType.telegram,
  PlatformType.reddit,
  PlatformType.url,
  PlatformType.github,
  PlatformType.discord,
  "CNAME",
];

export const resolveSNSHandle = async (
  handle: string,
  ns?: boolean
) => {
  const response = await queryIdentityGraph(
    handle,
    PlatformType.sns,
    GET_PROFILES(ns)
  );

  const profile = response?.data?.identity?.profile;
  if (!profile) {
    if (regexSolana.test(handle)) {
      return {
        address: handle,
        identity: handle,
        platform: PlatformType.solana,
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
  }

  const linksObj: Record<
    string,
    {
      link: string;
      handle: string;
    }
  > = {};
  if (profile.texts) {
    recordsShouldFetch.forEach((x) => {
      const handle = resolveHandle(profile?.texts[x]);
      if (handle) {
        const type = ["CNAME", PlatformType.url].includes(x)
          ? PlatformType.website
          : x;
        linksObj[type] = {
          link: getSocialMediaLink(handle, type)!,
          handle: handle,
        };
      }
    });
  }

  const nsObj = {
    address: profile.address,
    identity: profile.identity,
    platform: PlatformType.sns,
    displayName: profile.displayName,
    avatar: resolveIPFS_URL(profile.avatar),
    description: profile.description,
  };

  return ns
    ? nsObj
    : {
        ...nsObj,
        email: profile.texts?.email || null,
        location: profile.texts?.location || null,
        header: profile.texts?.background || null,
        contenthash:
          profile.texts?.["IPNS"] ||
          profile.texts?.["IPFS"] ||
          (await resolveContentIPNS(profile.identity)),
        links: linksObj,
      };
};
