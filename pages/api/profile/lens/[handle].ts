import type { NextApiRequest } from "next";
import {
  getSocialMediaLink,
  resolveEipAssetURL,
  resolveHandle,
} from "@/utils/resolver";
import { getLensProfileQuery } from "@/utils/lens";
import { LinksItem, errorHandle, ErrorMessages } from "@/utils/base";
import { PlatformType, PlatformData } from "@/utils/platform";
import { regexEth, regexLens } from "@/utils/regexp";
import { isAddress } from "ethers/lib/utils";

export const enum LensParamType {
  domain = "domain",
  address = "address",
}

export const config = {
  runtime: "edge",
};
const LensGraphQLEndpoint = "https://api.lens.dev/";

export const getLensProfile = async (handle: string, type: LensParamType) => {
  const query = getLensProfileQuery(type);

  try {
    const payload = {
      query,
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

    if (fetchRes)
      return fetchRes.data?.[
        type === LensParamType.address ? "defaultProfile" : "profile"
      ];
  } catch (e) {
    return null;
  }
};
export const resolveETHFromLens = async (lens: string) => {
  const response = await getLensProfile(lens, LensParamType.domain);
  return response.ownedBy;
};

const resolveNameFromLens = async (handle: string) => {
  try {
    let response;
    if (isAddress(handle)) {
      response = await getLensProfile(handle, LensParamType.address);
    } else {
      response = await getLensProfile(handle, LensParamType.domain);
    }
    if (!response) {
      return errorHandle({
        identity: handle,
        platform: PlatformType.lens,
        code: 404,
        message: ErrorMessages.notFound,
      });
    }
    const pureHandle = response.handle.replaceAll(".lens", "");
    let LINKRES = {};
    if (response.attributes) {
      const linksRecords = response.attributes;
      const linksToFetch = linksRecords.reduce(
        (pre: Array<any>, cur: { key: string }) => {
          if (Object.keys(PlatformData).includes(cur.key)) pre.push(cur.key);
          return pre;
        },
        []
      );

      const getLink = async () => {
        const _linkRes: Partial<Record<string, LinksItem>> = {};
        for (let i = 0; i < linksToFetch.length; i++) {
          const recordText = linksToFetch[i];
          const handle = resolveHandle(
            linksRecords?.find((o: { key: any }) => o.key === recordText)?.value
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
      address: response.ownedBy?.toLowerCase(),
      identity: response.handle,
      platform: PlatformData.lens.key,
      displayName: response.name,
      avatar: (await resolveEipAssetURL(avatarUri)) || null,
      email: null,
      description: response.bio,
      location:
        response.attributes?.find((o: { key: string }) => o.key === "location")
          ?.value || null,
      header: (await resolveEipAssetURL(coverPictureUri)) || "",
      links: LINKRES,
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
      identity: handle,
      platform: PlatformType.lens,
      code: 500,
      message: error.message,
    });
  }
};

export default async function handler(req: NextApiRequest) {
  const { searchParams } = new URL(req.url as string);
  const inputName = searchParams.get("handle");

  const lowercaseName = inputName?.toLowerCase() || "";

  if (!regexLens.test(lowercaseName) && !regexEth.test(lowercaseName))
    return errorHandle({
      identity: lowercaseName,
      platform: PlatformType.lens,
      code: 404,
      message: ErrorMessages.invalidIdentity,
    });
  return resolveNameFromLens(lowercaseName);
}
