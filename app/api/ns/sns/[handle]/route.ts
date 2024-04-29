import { errorHandle, formatText, respondWithCache } from "@/utils/base";
import { PlatformType } from "@/utils/platform";
import { regexSns, regexSolana } from "@/utils/regexp";
import { clusterApiUrl, Connection } from "@solana/web3.js";
import { Record as SNSRecord } from "@bonfida/spl-name-service";
import { ErrorMessages } from "@/utils/types";
import {
  getSNSRecord,
  resolveSNSDomain,
  reverseWithProxy,
} from "@/app/api/profile/sns/[handle]/route";
import { NextRequest } from "next/server";

const resolveSNSHandleNS = async (handle: string) => {
  let domain = "",
    address = "";
  const connection = new Connection(clusterApiUrl("mainnet-beta"));
  if (regexSns.test(handle)) {
    domain = handle;
    address = await resolveSNSDomain(connection, handle);
  } else {
    address = handle;
    domain = await reverseWithProxy(handle);
  }
  if (!domain) {
    return {
      address: address,
      identity: address,
      platform: PlatformType.solana,
      displayName: formatText(address),
      avatar: null,
      description: null,
    };
  }
  const resJSON = {
    address: address,
    identity: domain,
    platform: PlatformType.sns,
    displayName: domain,
    avatar: await getSNSRecord(connection, domain, SNSRecord.Pic),
    description: await getSNSRecord(connection, domain, SNSRecord.TXT),
  };
  return resJSON;
};

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const inputName = searchParams.get("handle") || "";
  if (!regexSns.test(inputName) && !regexSolana.test(inputName))
    return errorHandle({
      identity: inputName,
      platform: PlatformType.sns,
      code: 404,
      message: ErrorMessages.invalidIdentity,
    });

  return resolveSNSRespondNS(inputName);
}

export const resolveSNSRespondNS = async (handle: string) => {
  try {
    const json = await resolveSNSHandleNS(handle);
    return respondWithCache(JSON.stringify(json));
  } catch (e: any) {
    return errorHandle({
      identity: handle,
      platform: PlatformType.sns,
      code: e.cause || 500,
      message: e.message,
    });
  }
};

export const runtime = "edge";
export const preferredRegion = ["sfo1", "iad1", "pdx1"];
