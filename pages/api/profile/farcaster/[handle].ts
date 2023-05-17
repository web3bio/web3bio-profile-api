import type { NextApiRequest } from "next";
import { LinksItem, errorHandle } from "@/utils/base";
import { getSocialMediaLink, resolveHandle } from "@/utils/resolver";
import { PlatfomData, PlatformType } from "@/utils/platform";
import { regexTwitter } from "@/utils/regexp";

export const config = {
  runtime: "edge",
};

const originBase = "https://searchcaster.xyz/api/";

const regexTwitterLink = /(\S*).twitter/i;

const FetchFromOrigin = async (value: string) => {
  if (!value) return;
  const res = await fetch(originBase + `profiles?username=${value}`).then(
    (res) => res.json()
  );
  return res;
};

const resolveFarcasterHandle = async (handle: string) => {
  try {
    const response = await FetchFromOrigin(handle);
    if (!response || !response.length) {
      return errorHandle(handle);
    }
    const _res = response[0].body;
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
      address: response[0].connectedAddress || _res.address,
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
  } catch (e: any) {
    return new Response(
      JSON.stringify({
        identity: handle,
        error: e.message,
      }),
      {
        status: 500,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  }
};

export default async function handler(req: NextApiRequest) {
  const { searchParams } = new URL(req.url as string);
  const inputName = searchParams.get("handle");

  const lowercaseName = inputName?.toLowerCase() || "";

  if (!lowercaseName || !regexTwitter.test(lowercaseName))
    return errorHandle(lowercaseName);
  return resolveFarcasterHandle(lowercaseName);
}
