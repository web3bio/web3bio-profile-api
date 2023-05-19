import type { NextApiRequest } from "next";
import {
  getSocialMediaLink,
  resolveEipAssetURL,
  resolveHandle,
} from "@/utils/resolver";
import _ from "lodash";
import { GET_PROFILE_LENS } from "@/utils/lens";
import { LinksItem, errorHandle, ErrorMessages } from "@/utils/base";
import { PlatformType, PlatfomData } from "@/utils/platform";
import { regexLens } from "@/utils/regexp";

export const config = {
  runtime: "edge",
  unstable_allowDynamic: ["**/node_modules/lodash/**/*.js"],
};
const LensGraphQLEndpoint = "https://api.lens.dev/";

export const getLensProfile = async (handle: string) => {
  try {
    const payload = {
      query: GET_PROFILE_LENS,
      variables: {
        handle,
      },
    };
    const fetchRes = await fetch(LensGraphQLEndpoint, {
      method: "POST",
      body: JSON.stringify(payload),
      headers: {
        "Content-Type": "application/json",
      },
    }).then((res) => res.json());
    if (fetchRes) return fetchRes.data.profile;
  } catch (e) {
    return null;
  }
};

const resolveNameFromLens = async (handle: string) => {
  try {
    const response = await getLensProfile(handle);
    if (!response) {
      return errorHandle({
        address: null,
        identity: handle,
        platform: PlatformType.lens,
        code: 404,
        message: ErrorMessages.notFound,
      });
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
      address: response.ownedBy,
      identity: response.handle,
      platform: PlatfomData.lens.key,
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
        platform: PlatfomData.lens.key,
        error: error.message,
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

  if (!regexLens.test(lowercaseName))
    return errorHandle({
      address: null,
      identity: lowercaseName,
      platform: PlatformType.lens,
      code: 404,
      message: ErrorMessages.notExist,
    });
  return resolveNameFromLens(lowercaseName);
}
