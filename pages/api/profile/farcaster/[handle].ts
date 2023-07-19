import type { NextApiRequest } from "next";
import { LinksItem, errorHandle, ErrorMessages } from "@/utils/base";
import { getSocialMediaLink, resolveHandle } from "@/utils/resolver";
import { PlatfomData, PlatformType } from "@/utils/platform";
import { regexEth, regexFarcaster } from "@/utils/regexp";
import { isAddress } from "ethers/lib/utils";

export const config = {
  runtime: "edge",
};
export const enum FarcasterQueryParamType {
  username = "username",
  connected_address = "connected_address",
}

const originBase = "https://api.warpcast.com/v2/";

const regexTwitterLink = /(\S*)(.|@)twitter/i;

const _fetcher = (url: string) => {
  return fetch(url, {
    headers: {
      Authorization: process.env.NEXT_PUBLIC_FARCASTER_API_KEY || "",
    },
  });
};

const fetchWarpcastWithAddress = async (address: string) => {
  if (!address) return;

  const res = await _fetcher(
    originBase + `user-by-verification?address=${address}`
  ).then((res) => res.json());
  return res;
};
const fetchFidFromWarpcastWithUsername = async (uname: string) => {
  if (!uname) return;
  const res = await _fetcher(
    originBase + `user-by-username?username=${uname}`
  ).then((res) => res.json());
  return res;
};

const fetchAddressesFromWarpcastWithFid = async (fid: string) => {
  if (!fid) return;
  const res = await _fetcher(originBase + `verifications?fid=${fid}`).then(
    (res) => res.json()
  );
  return res;
};

const resolveFarcasterHandle = async (handle: string) => {
  try {
    let response;
    if (isAddress(handle)) {
      response = {
        address: handle.toLowerCase(),
        ...(await fetchWarpcastWithAddress(handle)).result.user,
      };
    } else {
      const rawUser = (await fetchFidFromWarpcastWithUsername(handle))?.result
        .user;
      const fristAddress = (
        await fetchAddressesFromWarpcastWithFid(rawUser?.fid)
      )?.result.verifications?.[0]?.address;
      if (!fristAddress)
        return errorHandle({
          address: null,
          identity: handle,
          platform: PlatformType.farcaster,
          code: 404,
          message: ErrorMessages.notFound,
        });
      response = {
        address: fristAddress.toLowerCase(),
        ...rawUser,
      };
    }
    if (!response) {
      if (isAddress(handle)) {
        return errorHandle({
          address: handle,
          identity: null,
          platform: PlatformType.farcaster,
          code: 404,
          message: ErrorMessages.notFound,
        });
      } else {
        return errorHandle({
          address: null,
          identity: handle,
          platform: PlatformType.farcaster,
          code: 404,
          message: ErrorMessages.notFound,
        });
      }
    }
    const resolvedHandle = resolveHandle(response.username);
    const LINKERS: Partial<Record<PlatformType, LinksItem>> = {
      [PlatformType.farcaster]: {
        link: getSocialMediaLink(resolvedHandle, PlatformType.farcaster),
        handle: resolvedHandle,
      },
    };
    if (
      response.profile.bio.text &&
      response.profile.bio.text.match(regexTwitterLink)
    ) {
      const text = response.profile.bio.text;
      const matched = text.match(regexTwitterLink)[1];
      const resolveMatch = resolveHandle(matched);
      LINKERS[PlatformType.twitter] = {
        link: getSocialMediaLink(resolveMatch, PlatformType.twitter),
        handle: resolveMatch,
      };
    }
    const resJSON = {
      address: response.address.toLowerCase(),
      identity: response.username || response.displayName,
      platform: PlatfomData.farcaster.key,
      displayName: response.displayName || resolvedHandle,
      avatar: response.pfp.url,
      email: null,
      description: response.profile.bio.text,
      location: null,
      header: null,
      links: LINKERS,
      addresses: {
        eth: response.address.toLowerCase(),
      },
    };
    return new Response(JSON.stringify(resJSON), {
      status: 200,
      headers: {
        "Cache-Control": `public, s-maxage=${
          60 * 60 * 24 * 7
        }, stale-while-revalidate=${60 * 30}`,
      },
    });
  } catch (error: any) {
    return errorHandle({
      address: null,
      identity: handle,
      platform: PlatformType.farcaster,
      code: 500,
      message: error.message,
    });
  }
};

export default async function handler(req: NextApiRequest) {
  const { searchParams } = new URL(req.url as string);
  const inputName = searchParams.get("handle");

  const lowercaseName = inputName?.toLowerCase() || "";

  if (
    !lowercaseName ||
    (!regexFarcaster.test(lowercaseName) && !regexEth.test(lowercaseName))
  )
    return errorHandle({
      address: null,
      identity: lowercaseName,
      platform: PlatformType.farcaster,
      code: 404,
      message: ErrorMessages.invalidIdentity,
    });
  return resolveFarcasterHandle(lowercaseName);
}
