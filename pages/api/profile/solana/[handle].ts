import { ErrorMessages, errorHandle, respondWithCache } from "@/utils/base";
import { PlatformType } from "@/utils/platform";
import { regexSns, regexSolana } from "@/utils/regexp";

import {
  Record as SNSRecord,
  getRecord,
  resolve,
} from "@bonfida/spl-name-service";
import { Connection, clusterApiUrl } from "@solana/web3.js";
import { NextApiRequest } from "next";

const solanaEndpoint = "https://sns-sdk-proxy.bonfida.workers.dev/";

const reverse = async (address: string) => {
  const res = await fetch(solanaEndpoint + "favorite-domain/" + address)
    .then((res) => res.json())
    .catch(() => null);
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
  let domain,
    address = "";
  const connection = new Connection(clusterApiUrl("mainnet-beta"));
  if (regexSns.test(handle)) {
    domain = handle;
    address = (await resolve(connection, handle))?.toBase58();
  } else {
    address = handle;
    domain = await reverse(handle);
  }
  const linksObj: Record<
    string,
    {
      link: string;
      handle: string;
    }
  > = {};

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
    contenthash: await getSNSRecord(connection, domain, SNSRecord.IPFS),
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
