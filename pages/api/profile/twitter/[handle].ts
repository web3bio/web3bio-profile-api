import type { NextApiRequest } from "next";
import { getSocialMediaLink, resolveHandle } from "@/utils/resolver";
import { LinksItem, errorHandle } from "@/utils/base";
import { PlatformType } from "@/utils/platform";
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
      errorHandle(handle);
      return;
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
      owner: resolvedHandle,
      identity: resolvedHandle,
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
        error: e.message,
      }),
      {
        status: 500,
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
  return resolveTwitterHandle(lowercaseName);
}
