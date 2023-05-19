import type { NextApiRequest } from "next";
import { getSocialMediaLink, resolveHandle } from "@/utils/resolver";
import { LinksItem, errorHandle, ErrorMessages } from "@/utils/base";
import { PlatfomData, PlatformType } from "@/utils/platform";
import { regexTwitter } from "@/utils/regexp";

export const config = {
  runtime: "edge",
};

const originBase =
  "https://mr8asf7i4h.execute-api.us-east-1.amazonaws.com/prod/";

const FetchFromOrigin = async (value: string) => {
  if (!value) return;
  const res = await fetch(
    originBase + `twitter-identity?screenName=${value}`
  ).then((res) => {
    if (res.status !== 200) return null;
    return res.json();
  });
  return res;
};

const transformImageURLSize = (url: string, size: string = "400x400") => {
  if (!url) return null;
  return url.replaceAll("_normal.", `_${size}.`);
};
const resolveTwitterHandle = async (handle: string) => {
  try {
    const response = await FetchFromOrigin(handle);
    if (!response) {
      return errorHandle({
        address: null,
        identity: handle,
        platform: PlatformType.twitter,
        code: 404,
        message: ErrorMessages.notFound,
      });
    }
    const urlHandle = resolveHandle(
      response.entities.url
        ? response.entities.url.urls[0].expanded_url
        : response.url || null
    );
    const resolvedHandle = resolveHandle(handle);
    const LINKRES: Partial<Record<PlatformType, LinksItem>> = {
      [PlatformType.twitter]: {
        link: getSocialMediaLink(resolvedHandle, PlatformType.twitter),
        handle: resolvedHandle,
      },
    };
    if (urlHandle) {
      LINKRES[PlatformType.website] = {
        link: getSocialMediaLink(urlHandle, PlatformType.website),
        handle: urlHandle,
      };
    }
    const resJSON = {
      address: null,
      identity: resolvedHandle,
      platform: PlatfomData.twitter.key,
      displayName: response.name || resolvedHandle,
      avatar: transformImageURLSize(
        response.profile_image_url_https || response.profile_image_url || null,
        "400x400"
      ),
      email: null,
      description: response.description,
      location: response.location,
      header: response.profile_banner_url,
      links: LINKRES,
      addresses: null,
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
        platform: PlatfomData.twitter.key,
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
    return errorHandle({
      address: null,
      identity: lowercaseName,
      platform: PlatformType.twitter,
      code: 404,
      message: ErrorMessages.notExist,
    });
  return resolveTwitterHandle(lowercaseName);
}
