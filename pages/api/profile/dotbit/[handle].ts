import type { NextApiRequest, NextApiResponse } from "next";
import {
  getSocialMediaLink,
  resolveHandle,
  resolveMediaURL,
} from "@/utils/resolver";
import _ from "lodash";
import {
  AddressesData,
  HandleNotFoundResponseData,
  HandleResponseData,
  LinksItem,
  errorHandle,
} from "@/utils/base";
import { createInstance } from "dotbit";
import { BitPluginAvatar } from "@dotbit/plugin-avatar";
import { PlatformType, PlatfomData } from "@/utils/platform";
import { regexDotbit } from "@/utils/regexp";

const resolveNameFromDotbit = async (
  handle: string,
  res: NextApiResponse<HandleResponseData | HandleNotFoundResponseData>
) => {
  try {
    const dotbit = createInstance();
    dotbit.installPlugin(new BitPluginAvatar());
    const baseInfo = await dotbit.accountInfo(handle);
    const avatar =
      (await dotbit.records(handle, "profile.avatar"))[0]?.value ||
      (await dotbit.avatar(handle))?.url;
    const records = await dotbit.records(handle);
    const addresses = await dotbit.addresses(handle);
    let LINKRES: Partial<Record<string, LinksItem>> = {};
    let CRYPTORES: Partial<AddressesData> = {};
    if (records && records.length > 0) {
      const getLink = async () => {
        const _linkRes: Partial<Record<string, LinksItem>> = {};
        records.map((x) => {
          if (
            x.type === "profile" &&
            !["avatar", "description", "email"].includes(x.subtype)
          ) {
            const key =
              _.find(PlatfomData, (o) => {
                if (o.dotbitText) {
                  return o.dotbitText?.includes(x.key);
                }
                return false;
              })?.key || x.key;

            const resolvedHandle = resolveHandle(x.value);
            _linkRes[key] = {
              link:
                key === PlatformType.website
                  ? x.value
                  : getSocialMediaLink(resolvedHandle, key as PlatformType),
              handle: resolvedHandle,
            };
          }
        });
        return _linkRes;
      };
      LINKRES = await getLink();
    }

    if (addresses && addresses.length) {
      CRYPTORES = addresses.reduce((pre, cur) => {
        const key = cur.key.replaceAll("address.", "");
        if (!pre[key]) {
          pre[key] = cur.value;
        }
        return pre;
      }, {} as any);
    }

    const resJSON = {
      owner: baseInfo.owner_key || baseInfo.manager_key,
      identity: baseInfo.account || baseInfo.account_alias,
      displayName: baseInfo.account || baseInfo.account_alias || handle,
      avatar: resolveMediaURL(avatar) || "",
      email: (await dotbit.records(handle, "profile.email"))[0]?.value,
      description: (await dotbit.records(handle, "profile.description"))[0]
        ?.value,
      location: null,
      header: null,
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
    error.code === 2006
      ? res.status(404).json({
          identity: handle,
          error: "No results",
        })
      : res.status(500).json({
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
  if (!regexDotbit.test(inputName)) return errorHandle(inputName, res);
  return resolveNameFromDotbit(inputName.toLowerCase(), res);
}
