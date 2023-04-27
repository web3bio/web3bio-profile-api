import type { NextApiRequest, NextApiResponse } from "next";
import {
  getSocialMediaLink,
  resolveEipAssetURL,
  resolveHandle,
} from "@/utils/resolver";
import _ from "lodash";
import { GET_PROFILE_LENS } from "@/utils/lens";
import {
  HandleNotFoundResponseData,
  HandleResponseData,
  LinksItem,
  errorHandle,
  resolve,
} from "@/utils/base";
import { PlatformType, PlatfomData } from "@/utils/platform";
import { regexLens } from "@/utils/regexp";
import client from "@/utils/apollo";

export const getLensProfile = async (handle: string) => {
  const fetchRes = await client.query({
    query: GET_PROFILE_LENS,
    variables: {
      handle,
    },
    context: {
      uri: process.env.NEXT_PUBLIC_LENS_GRAPHQL_SERVER,
    },
  });
  if (fetchRes) return fetchRes.data.profile;
  return null;
};

const resolveNameFromLens = async (
  handle: string,
  res: NextApiResponse<HandleResponseData | HandleNotFoundResponseData>
) => {
  try {
    const response = await getLensProfile(handle);
    if (!response) {
      errorHandle(handle, res);
      return;
    }
    const pureHandle = handle.replaceAll(".lens", "");
    let LINKRES = {};
    let CRYPTORES = {
      matic: response.ownedBy,
    };
    if (response.attributes) {
      const linksRecords = response.attributes;
      const linksToFetch = linksRecords.reduce(
        (pre: Array<any>, cur: { key: string }) => {
          if (Object.keys(PlatfomData).includes(cur.key)) pre.push(cur.key);
          return pre;
        },
        []
      );

      const getLink = async () => {
        const _linkRes: Partial<Record<string, LinksItem>> = {};
        for (let i = 0; i < linksToFetch.length; i++) {
          const recordText = linksToFetch[i];
          const handle = resolveHandle(
            _.find(linksRecords, (o) => o.key === recordText)?.value
          );
          if (handle) {
            const resolvedHandle =
              recordText === PlatformType.twitter
                ? handle.replaceAll("@", "")
                : handle;
            _linkRes[recordText] = {
              link: getSocialMediaLink(resolvedHandle, recordText),
              handle: resolvedHandle,
            };
          }
        }
        return _linkRes;
      };
      LINKRES = {
        [PlatformType.lenster]: {
          link: getSocialMediaLink(pureHandle, PlatformType.lenster),
          handle: pureHandle,
        },
        ...(await getLink()),
      };
    }
    const resJSON = {
      owner: response.ownedBy,
      identity: response.handle,
      displayName: response.name,
      avatar:
        (await resolveEipAssetURL(response.picture?.original.url || "")) || "",
      email: null,
      description: response.bio,
      location: response.attributes
        ? _.find(response.attributes, (o) => o.key === "location")?.value
        : null,
      header:
        (await resolveEipAssetURL(response.coverPicture?.original.url || "")) ||
        "",
      links: LINKRES,
      addresses: CRYPTORES,
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
  } catch (error: any) {
    res.status(500).json({
      identity: handle,
      error: error.message,
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
  if (!regexLens.test(inputName)) return errorHandle(inputName, res);
  return resolveNameFromLens(inputName, res);
}
