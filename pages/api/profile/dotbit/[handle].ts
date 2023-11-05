import type { NextApiRequest } from "next";
import { errorHandle, ErrorMessages, respondWithCache } from "@/utils/base";
import { getSocialMediaLink, resolveHandle } from "@/utils/resolver";
import { PlatformType } from "@/utils/platform";
import { regexDotbit, regexEth } from "@/utils/regexp";
import { isAddress } from "ethers/lib/utils";
import { CoinType } from "@/utils/cointype";

export const config = {
  runtime: "edge",
  regions: ["sfo1", "hnd1", "sin1"],
};
export interface RecordItem {
  key: string;
  label: string;
  value: string;
  ttl: string;
}

const DotbitEndPoint = "https://indexer-v1.did.id/";

export const fetchDotbitProfile = async (path: string, payload: string) => {
  const response = await fetch(DotbitEndPoint + path, {
    method: "POST",
    body: payload,
  }).then((res) => res.json());
  return response?.data;
};

export const resolveDotbitResponse = async (handle: string) => {
  let domain;
  let address;
  if (isAddress(handle)) {
    const res = await fetchDotbitProfile(
      "v1/reverse/record",
      JSON.stringify({
        type: "blockchain",
        key_info: {
          coin_type: CoinType.eth.toString(),
          key: handle,
        },
      })
    );
    if (!res?.account) {
      throw new Error(ErrorMessages.notFound, { cause: 404 });
    }
    address = handle;
    domain = res.account;
  } else {
    const res = await fetchDotbitProfile(
      "v1/account/info",
      JSON.stringify({ account: handle })
    );

    if (!res) {
      throw new Error(ErrorMessages.notFound, { cause: 404 });
    }
    domain = res.account_info.account || handle;
    address = res.account_info.owner_key.toLowerCase();
  }
  const recordsResponse = await fetchDotbitProfile(
    "v1/account/records",
    JSON.stringify({ account: domain })
  );

  const recordsMap = new Map<string, RecordItem>(
    recordsResponse?.records?.map((x: RecordItem) => [x.key, { ...x }])
  );

  return {
    domain,
    address,
    recordsMap,
  };
};

export const resolveDotbitHandle = async (handle: string) => {
  let avatar;
  let location;
  let header;
  const { address, domain, recordsMap } = await resolveDotbitResponse(handle);

  const linksObj: Record<
    string,
    {
      handle: string;
      link: string;
    }
  > = {};
  recordsMap.forEach((x) => {
    if (x.key.includes("profile.")) {
      const platform = x.key.replace("profile.", "");
      if (platform === "avatar") avatar = x.value;
      if (x.key.toLowerCase().includes("header")) header = x.value;
      if (x.key.toLowerCase().includes("location")) location = x.value;
      if (!["description", "email", "avatar"].includes(platform) && x.value) {
        const _handle = resolveHandle(x.value, platform as PlatformType)!;
        linksObj[platform] = {
          handle: _handle,
          link: getSocialMediaLink(x.value, platform as PlatformType)!,
        };
      }
    }
  });
  return {
    address,
    identity: domain,
    platform: PlatformType.dotbit,
    displayName: domain || null,
    avatar: avatar || null,
    email: recordsMap.get("profile.email")?.value || null,
    description: recordsMap.get("profile.description")?.value || null,
    location: location || null,
    header: header || null,
    links: linksObj,
  };
};

const resolveDotbitRespond = async (handle: string) => {
  try {
    const json = await resolveDotbitHandle(handle);
    return respondWithCache(JSON.stringify(json));
  } catch (e: any) {
    return errorHandle({
      identity: handle,
      platform: PlatformType.dotbit,
      code: e.cause || 500,
      message: e.message,
    });
  }
};

export default async function handler(req: NextApiRequest) {
  const { searchParams } = new URL(req.url as string);
  const inputName = searchParams.get("handle");
  const lowercaseName = inputName?.toLowerCase() || "";

  if (!regexDotbit.test(lowercaseName) && !regexEth.test(lowercaseName))
    return errorHandle({
      identity: lowercaseName,
      platform: PlatformType.dotbit,
      code: 404,
      message: ErrorMessages.invalidIdentity,
    });
  return resolveDotbitRespond(lowercaseName);
}
