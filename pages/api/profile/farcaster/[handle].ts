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

const regexTwitterLink = /(\S*).twitter/i;

export const FetchFromFarcasterOrigin = async (
  value: string,
  type: FarcasterQueryParamType
) => {
  if (!value) return;
  const queryPath =
    type === FarcasterQueryParamType.connected_address
      ? `user-by-verification?address=${value}`
      : `verifications?fid=966`;
  const res = await fetch(originBase + queryPath, {
    headers: {
      Authorization: process.env.NEXT_PUBLIC_FARCASTER_API_KEY || "",
    },
  }).then((res) => res.json());
  console.log(res, "kkkk");
  return res;
};

const resolveFarcasterHandle = async (handle: string) => {
  try {
    let response;
    if (isAddress(handle)) {
      response = await FetchFromFarcasterOrigin(
        handle,
        FarcasterQueryParamType.connected_address
      );
    } else {
      response = await FetchFromFarcasterOrigin(
        handle,
        FarcasterQueryParamType.username
      );
    }
    if (!response || !response.length) {
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
    const _res = response?.result.user;
    const resolvedHandle = resolveHandle(_res.username);
    const LINKRES: Partial<Record<PlatformType, LinksItem>> = {
      [PlatformType.farcaster]: {
        link: getSocialMediaLink(resolvedHandle, PlatformType.farcaster),
        handle: resolvedHandle,
      },
    };
    if (_res.bio && _res.bio.match(regexTwitterLink)) {
      const matched = _res.bio.match(regexTwitterLink)[1];
      const resolveMatch = resolveHandle(matched);
      LINKRES[PlatformType.twitter] = {
        link: getSocialMediaLink(resolveMatch, PlatformType.twitter),
        handle: resolveMatch,
      };
    }
    const resJSON = {
      address: isAddress(handle) ? handle.toLowerCase() : null,
      identity: _res.username || _res.displayName,
      platform: PlatfomData.farcaster.key,
      displayName: _res.displayName || resolvedHandle,
      avatar: _res.avatarUrl,
      email: null,
      description: _res.bio,
      location: null,
      header: null,
      links: LINKRES,
      addresses: {
        eth: response[0].connectedAddress || _res.address,
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
