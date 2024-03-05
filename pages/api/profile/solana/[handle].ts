import { ErrorMessages, errorHandle, respondWithCache } from "@/utils/base";
import { PlatformType } from "@/utils/platform";
import { regexSns, regexSolana } from "@/utils/regexp";
import { getSocialMediaLink } from "@/utils/resolver";
import { NextApiRequest } from "next";

const solanaEndpoint = "https://sns-sdk-proxy.bonfida.workers.dev/";

const getTwitterHandle = async (pubKey: string) => {
  const res = await fetch(
    solanaEndpoint + "twitter/get-handle-by-key/" + pubKey
  )
    .then((res) => res.json())
    .catch(() => null);
  return res?.result;
};

const getRecordContent = async (domain: string, record: string) => {};

const lookup = async (handle: string) => {
  const res = await fetch(solanaEndpoint + "resolve/" + handle)
    .then((res) => res.json())
    .catch(() => null);
  return res?.result;
};

const reverse = async (address: string) => {
  const res = await fetch(solanaEndpoint + "favorite-domain/" + address)
    .then((res) => res.json())
    .catch(() => null);
  return res?.result?.reverse + ".sol";
};

const getDomainPubkey = async (domain: string) => {
  const res = await fetch(solanaEndpoint + "domain-key/" + domain)
    .then((res) => res.json())
    .catch(() => null);
  return res?.result;
};

const resolveSolanaHandle = async (handle: string) => {
  let domain,
    address = "";
  if (regexSns.test(handle)) {
    domain = handle;
    address = await lookup(handle);
  } else {
    address = handle;
    domain = await reverse(handle);
  }
  const pubkey = await getDomainPubkey(domain);
  const twitterHandle = await getTwitterHandle(pubkey);
  const linksObj: Record<
    string,
    {
      link: string;
      handle: string;
    }
  > = {};
  if (twitterHandle) {
    linksObj[PlatformType.twitter] = {
      handle: twitterHandle,
      link: getSocialMediaLink(twitterHandle, PlatformType.twitter) || "",
    };
  }
  const json = {
    address,
    identity: domain,
    platform: PlatformType.solana,
    displayName: domain || null,
    avatar: null,
    description: null,
    email: null,
    location: null,
    header: null,
    contenthash: null,
    links: linksObj,
  };
  return json;
};

export const resolveSolanaResopond = async (handle: string) => {
  try {
    const json = await resolveSolanaHandle(handle);
    return respondWithCache(JSON.stringify(json));
  } catch (e: any) {
    return errorHandle({
      identity: handle,
      platform: PlatformType.solana,
      code: e.cause || 500,
      message: e.message,
    });
  }
};

export default async function handler(req: NextApiRequest) {
  const { searchParams } = new URL(req.url as string);
  const inputName = searchParams.get("handle");
  if (
    (!regexSns.test(inputName!) && !regexSolana.test(inputName!)) ||
    !inputName
  )
    return errorHandle({
      identity: inputName,
      platform: PlatformType.solana,
      code: 404,
      message: ErrorMessages.invalidIdentity,
    });

  return resolveSolanaResopond(inputName);
}

export const config = {
  runtime: "edge",
  regions: ["sfo1", "iad1", "pdx1"],
};
