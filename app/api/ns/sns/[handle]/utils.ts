import { formatText } from "@/utils/base";
import { PlatformType } from "@/utils/platform";
import { regexSns } from "@/utils/regexp";
import { clusterApiUrl, Connection } from "@solana/web3.js";
import { Record as SNSRecord } from "@bonfida/spl-name-service";
import {
  getSNSRecord,
  resolveSNSDomain,
  reverseWithProxy,
} from "@/app/api/profile/sns/[handle]/utils";

export const resolveSNSHandleNS = async (handle: string) => {
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
  return {
    address: address,
    identity: domain,
    platform: PlatformType.sns,
    displayName: domain,
    avatar: await getSNSRecord(connection, domain, SNSRecord.Pic),
    description: await getSNSRecord(connection, domain, SNSRecord.TXT),
  };
};
