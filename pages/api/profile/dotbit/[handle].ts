import type { NextApiRequest } from "next";
import { errorHandle, ErrorMessages, respondWithCache } from "@/utils/base";
import { getSocialMediaLink, resolveHandle } from "@/utils/resolver";
import { PlatformType } from "@/utils/platform";
import { regexDotbit, regexEth, regexFarcaster } from "@/utils/regexp";
import { isAddress } from "ethers/lib/utils";
import { CoinType } from "@/utils/cointype";

export const config = {
  runtime: "edge",
};
interface RecordItem {
  key: string;
  label: string;
  value: string;
  ttl: string;
}

const DotbitEndPoint = "https://indexer-v1.did.id/";

const fetchDotbitProfile = async (path: string, payload: string) => {
  const response = await fetch(DotbitEndPoint + path, {
    method: "POST",
    body: payload,
  }).then((res) => res.json());
  return response?.data;
};

const resolveDotbitHandle = async (handle: string) => {
  let address;
  let domain;
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
    address = res.account_info.owner_key;
  }
  const recordsResponse = await fetchDotbitProfile(
    "v1/account/records",
    JSON.stringify({ account: domain })
  );
  const recordsMap = new Map<string, RecordItem>(
    recordsResponse?.records?.map((x: RecordItem) => [x.key, { ...x }])
  );
  const linksObj: Record<
    string,
    {
      handle: string;
      link: string;
    }
  > = {};
  const cryptoObj: Record<string, string> = {
    eth: address.toLowerCase(),
  };
  recordsMap.forEach((x) => {
    if (x.key.includes("address.")) {
      cryptoObj[x.key.replace("address.", "")] = x.value?.toLocaleLowerCase();
    }
    if (x.key.includes("profile.")) {
      const platform = x.key.replace("profile.", "");
      if (!["description", "email"].includes(platform) && x.value) {
        const _handle = resolveHandle(x.value)!;
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
    displayName: domain,
    avatar: "https://display.did.id/identicon/" + domain,
    email: recordsMap.get("profile.email")?.value,
    description: recordsMap.get("profile.description")?.value,
    location: null,
    header: null,
    links: linksObj,
    addresses: cryptoObj,
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
