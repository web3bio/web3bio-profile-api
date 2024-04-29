import { errorHandle, formatText, respondWithCache } from "@/utils/base";
import { PlatformType } from "@/utils/platform";
import { regexSns } from "@/utils/regexp";
import { clusterApiUrl, Connection } from "@solana/web3.js";
import { Record as SNSRecord } from "@bonfida/spl-name-service";
import {
  getSNSRecord,
  resolveSNSDomain,
  reverseWithProxy,
} from "@/app/api/profile/sns/[handle]/utils";

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
