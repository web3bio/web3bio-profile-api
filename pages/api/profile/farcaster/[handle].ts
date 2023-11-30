import type { NextApiRequest } from "next";
import { errorHandle, ErrorMessages, respondWithCache } from "@/utils/base";
import { getSocialMediaLink, resolveHandle } from "@/utils/resolver";
import { PlatformType } from "@/utils/platform";
import { regexEns, regexEth, regexFarcaster } from "@/utils/regexp";
import { isAddress } from "ethers/lib/utils";
import {
  getResolverAddressFromName,
  resolveENSCoinTypesValue,
} from "../ens/[handle]";
import { CoinType } from "@/utils/cointype";

export const enum FarcasterQueryParamType {
  username = "username",
  connected_address = "connected_address",
}

const resolveENSHandleAddress = async (handle: string) => {
  const resolver = await getResolverAddressFromName(handle);
  if (!resolver) return null;
  return await resolveENSCoinTypesValue(resolver, handle, CoinType.eth);
};

const originBase = "https://api.warpcast.com/v2/";
const regexTwitterLink = /(\S*)(.|@)twitter/i;
const fetcher = (url: string) => {
  return fetch(url, {
    headers: {
      Authorization: process.env.NEXT_PUBLIC_FARCASTER_API_KEY || "",
    },
  });
};

const fetchWarpcastWithAddress = async (address: string) => {
  const res = await fetcher(
    originBase + `user-by-verification?address=${address}`
  ).then((res) => res.json());
  return res;
};
const fetchFidFromWarpcastWithUsername = async (uname: string) => {
  const res = await fetcher(
    originBase + `user-by-username?username=${uname}`
  ).then((res) => res.json());
  return res;
};

const fetchAddressesFromWarpcastWithFid = async (fid: string) => {
  const res = await fetcher(originBase + `verifications?fid=${fid}`).then(
    (res) => res.json()
  );
  return res;
};

const resolveFarcasterLinks = (
  response: {
    username: string;
    profile: { bio: { text: string | null } };
  },
  resolvedHandle: string | null
) => {
  const LINKRES: {
    [key in PlatformType.twitter | PlatformType.farcaster]?: {
      link: string | null;
      handle: string | null;
    };
  } = resolvedHandle
    ? {
        farcaster: {
          link: getSocialMediaLink(resolvedHandle, PlatformType.farcaster),
          handle: resolvedHandle,
        },
      }
    : {};
  const bioText = response.profile.bio.text || "";
  const twitterMatch = bioText.match(regexTwitterLink);
  if (twitterMatch) {
    const matched = twitterMatch[1];
    const resolveMatch = resolveHandle(matched, PlatformType.farcaster);
    LINKRES[PlatformType.twitter] = {
      link: getSocialMediaLink(resolveMatch, PlatformType.twitter),
      handle: resolveMatch,
    };
  }

  return LINKRES;
};

export const resolveFarcasterResponse = async (handle: string) => {
  let response;
  if (isAddress(handle)) {
    const user = (await fetchWarpcastWithAddress(handle))?.result?.user;
    const firstAddress = (await fetchAddressesFromWarpcastWithFid(user?.fid))
      ?.result?.verifications?.[0]?.address;
    response = {
      address: firstAddress || handle.toLowerCase(),
      ...user,
    };
    if (!response?.username)
      throw new Error(ErrorMessages.notFound, { cause: 404 });
  } else {
    const rawUser = (await fetchFidFromWarpcastWithUsername(handle))?.result
      ?.user;
    if (!rawUser?.fid) throw new Error(ErrorMessages.notFound, { cause: 404 });

    const firstAddress = (await fetchAddressesFromWarpcastWithFid(rawUser?.fid))
      ?.result?.verifications?.[0]?.address;
    response = {
      address:
        firstAddress?.toLowerCase() ||
        (regexEns.test(handle) ? await resolveENSHandleAddress(handle) : null),
      ...rawUser,
    };
  }
  return response;
};

export const resolveFarcasterHandle = async (handle: string) => {
  const response = await resolveFarcasterResponse(handle);
  if (!response?.fid) throw new Error(ErrorMessages.notFound, { cause: 404 });
  const resolvedHandle = resolveHandle(response.username);
  const links = resolveFarcasterLinks(response, resolvedHandle);
  const resJSON = {
    address: response.address || null,
    identity: response.username,
    platform: PlatformType.farcaster,
    displayName: response.displayName || response.username,
    avatar: response.pfp.url,
    email: null,
    description: response.profile.bio.text || null,
    location: response?.profile.location.description || null,
    header: null,
    links: links,
  };
  return resJSON;
};

const resolveFarcasterRespond = async (handle: string) => {
  try {
    const json = await resolveFarcasterHandle(handle);
    return respondWithCache(JSON.stringify(json));
  } catch (e: any) {
    return errorHandle({
      identity: handle,
      platform: PlatformType.farcaster,
      code: e.cause || 500,
      message: e.message,
    });
  }
};

export default async function handler(req: NextApiRequest) {
  const { searchParams } = new URL(req.url as string);
  const inputName = searchParams.get("handle");
  const lowercaseName = inputName?.toLowerCase() || "";

  if (!regexFarcaster.test(lowercaseName) && !regexEth.test(lowercaseName))
    return errorHandle({
      identity: lowercaseName,
      platform: PlatformType.farcaster,
      code: 404,
      message: ErrorMessages.invalidIdentity,
    });
  return resolveFarcasterRespond(lowercaseName);
}

export const config = {
  runtime: "edge",
  regions: ["sfo1", "hnd1", "sin1"],
  unstable_allowDynamic: [
    "**/node_modules/lodash/**/*.js",
    "**/node_modules/@ensdomain/address-encoder/**/*.js",
    "**/node_modules/js-sha256/**/*.js",
  ],
};
