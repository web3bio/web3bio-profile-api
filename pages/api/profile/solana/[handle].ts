import {
  ErrorMessages,
  errorHandle,
  formatText,
  respondWithCache,
} from "@/utils/base";
import { PlatformType } from "@/utils/platform";
import { regexSns, regexSolana } from "@/utils/regexp";
import { getSocialMediaLink, resolveHandle } from "@/utils/resolver";
import {
  Record as SNSRecord,
  getRecord,
  resolve,
} from "@bonfida/spl-name-service";
import { Connection, clusterApiUrl } from "@solana/web3.js";
import { NextApiRequest } from "next";

const solanaEndpoint = "https://sns-sdk-proxy.bonfida.workers.dev/";

const recordsShouldFetch = [
  SNSRecord.Twitter,
  SNSRecord.Telegram,
  SNSRecord.Reddit,
  SNSRecord.Url,
  SNSRecord.Github,
  SNSRecord.Discord,
  SNSRecord.CNAME,
];

const reverse = async (address: string) => {
  const res = await fetch(solanaEndpoint + "favorite-domain/" + address)
    .then((res) => res.json())
    .catch(() => null);
  if (!res || res?.s === "error") return "";
  return res?.result?.reverse + ".sol";
};

const getSNSRecord = async (
  connection: Connection,
  domain: string,
  record: SNSRecord
) => {
  try {
    return await getRecord(connection, domain.slice(0, -4), record, true);
  } catch (e) {
    return null;
  }
};

const resolveSolanaHandle = async (handle: string) => {
  let domain = "",
    address = "";
  const connection = new Connection(clusterApiUrl("mainnet-beta"));
  if (regexSns.test(handle)) {
    domain = handle;
    address = (await resolve(connection, handle))?.toBase58();
  } else {
    address = handle;
    domain = await reverse(handle);
  }

  if (!address) {
    return errorHandle({
      identity: domain,
      platform: PlatformType.solana,
      code: 404,
      message: ErrorMessages.notFound,
    });
  }
  if (address && !domain) {
    return {
      address,
      identity: address,
      platform: PlatformType.solana,
      displayName: formatText(address),
      avatar: null,
      description: null,
      email: null,
      location: null,
      header: null,
      contenthash: null,
      links: null,
    };
  }
  const linksObj: Record<
    string,
    {
      link: string;
      handle: string;
    }
  > = {};

  for (let i = 0; i < recordsShouldFetch.length; i++) {
    const recordType = recordsShouldFetch[i];
    const handle = await getSNSRecord(connection, domain, recordType);
    if (handle) {
      const resolved = resolveHandle(handle);
      const type = [SNSRecord.CNAME, SNSRecord.Url].includes(recordType)
        ? PlatformType.website
        : recordType;
      linksObj[type] = {
        handle: resolved!,
        link: getSocialMediaLink(resolved, type)!,
      };
    }
  }

  const contentHash = await getSNSRecord(connection, domain, SNSRecord.IPFS);
  const json = {
    address,
    identity: domain,
    platform: PlatformType.solana,
    displayName: domain || null,
    avatar: await getSNSRecord(connection, domain, SNSRecord.Pic),
    description: await getSNSRecord(connection, domain, SNSRecord.TXT),
    email: await getSNSRecord(connection, domain, SNSRecord.Email),
    location: null,
    header: await getSNSRecord(connection, domain, SNSRecord.Background),
    contenthash: contentHash ? "ipfs://" + contentHash : null,
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
  maxDuration: 45,
  unstable_allowDynamic: [
    "/node_modules/rpc-websockets/node_modules/@babel/runtime/regenerator/index.js",
  ],
};
