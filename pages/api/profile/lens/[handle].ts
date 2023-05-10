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

const resolveNameFromLens = async (handle: string) => {
  try {
    const response = await getLensProfile(handle);
    if (!response) {
      errorHandle(handle);
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

    const avatarUri =
      response.picture?.original?.url || response.picture?.uri || "";
    const coverPictureUri =
      response.coverPicture?.original?.url || response.coverPicture?.uri || "";
    const resJSON = {
      owner: response.ownedBy,
      identity: response.handle,
      displayName: response.name,
      avatar: (await resolveEipAssetURL(avatarUri)) || "",
      email: null,
      description: response.bio,
      location: response.attributes
        ? _.find(response.attributes, (o) => o.key === "location")?.value
        : null,
      header: (await resolveEipAssetURL(coverPictureUri)) || "",
      links: LINKRES,
      addresses: CRYPTORES,
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
    return new Response(
      JSON.stringify({
        identity: handle,
        error: error.message,
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

  if (!regexLens.test(lowercaseName)) return errorHandle(lowercaseName);
  return resolveNameFromLens(lowercaseName);
}
