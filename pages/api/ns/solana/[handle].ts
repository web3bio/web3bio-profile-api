import { errorHandle, ErrorMessages, respondWithCache } from "@/utils/base";
import { PlatformType } from "@/utils/platform";
import { regexSns, regexSolana } from "@/utils/regexp";
import { NextApiRequest } from "next";
import { clusterApiUrl, Connection } from "@solana/web3.js";
import { Record as SNSRecord, resolve } from "@bonfida/spl-name-service";
import { getSNSRecord, reverse } from "../../profile/solana/[handle]";

export const resolveSolanaHandleNS = async (handle: string) => {
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

  const resJSON = {
    address: address,
    identity: domain,
    platform: PlatformType.solana,
    displayName: domain,
    avatar: await getSNSRecord(connection, domain, SNSRecord.Pic),
    description: await getSNSRecord(connection, domain, SNSRecord.TXT),
  };
  return resJSON;
};

const resolveSolanaRespond = async (handle: string) => {
  try {
    const json = await resolveSolanaHandleNS(handle);
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

  return resolveSolanaRespond(inputName);
}

export const config = {
  runtime: "edge",
  regions: ["sfo1", "iad1", "pdx1"],
};
