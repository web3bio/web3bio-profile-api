import type { NextApiRequest, NextApiResponse } from "next";
import { getSocialMediaLink, resolveHandle } from "@/utils/resolver";
import {
  HandleNotFoundResponseData,
  HandleResponseData,
  LinksItem,
  errorHandle,
  resolve,
} from "@/utils/base";
import { PlatformType } from "@/utils/platform";
import { regexTwitter } from "@/utils/regexp";

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
const resolveTwitterHandle = async (
  handle: string,
  res: NextApiResponse<HandleResponseData | HandleNotFoundResponseData>
) => {
  try {
    const response = await FetchFromOrigin(handle);
    if (!response) {
      errorHandle(handle, res);
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
    res
      .status(200)
      .setHeader(
        "Cache-Control",
        `public, s-maxage=${60 * 60 * 24 * 7}, stale-while-revalidate=${
          60 * 30
        }`
      )
      .json(resJSON);
  } catch (e: any) {
    res.status(500).json({
      identity: handle,
      error: e.message,
    });
  }
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<HandleResponseData | HandleNotFoundResponseData>
) {
  const inputName = req.query.handle as string;
  const lowercaseName = inputName.toLowerCase();
  if (inputName !== lowercaseName) {
    return res.redirect(307, resolve(req.url!, lowercaseName));
  }
  if (!lowercaseName || !regexTwitter.test(lowercaseName))
    return errorHandle(lowercaseName, res);
  return resolveTwitterHandle(lowercaseName, res);
}
