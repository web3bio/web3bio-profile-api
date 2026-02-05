import { queryIdentityGraph, QueryType } from "@/utils/query";
import { AuthHeaders } from "@/utils/types";
import { errorHandle, respondJson } from "@/utils/utils";
import { ErrorMessages, Platform } from "web3bio-profile-kit/types";

export const resolveWalletResponse = async (
  handle: string,
  platform: Platform,
  headers: AuthHeaders,
  pathname: string,
) => {
  const response = await queryIdentityGraph(
    QueryType.GET_WALLET_QUERY,
    handle,
    platform,
    headers,
  );

  const resolutionResult = resolveWalletResolution(
    response?.data?.identity?.identityGraph?.vertices,
    handle,
    platform,
  );
  if ("message" in resolutionResult) {
    return errorHandle({
      identity: resolutionResult.identity,
      path: pathname,
      platform: resolutionResult.platform,
      code: resolutionResult.code,
      message: resolutionResult.message,
    });
  }

  return respondJson(resolutionResult);
};

const resolveWalletResolution = (
  data: any,
  handle: string,
  platform: Platform,
): any => {
  if (!data.length)
    return {
      identity: handle,
      platform,
      code: 404,
      message: ErrorMessages.NOT_FOUND,
    };

  const res = {
    ens:
      data.find((x: any) => x.platform === Platform.ens && x.isPrimary) || null,
    sns:
      data.find((x: any) => x.platform === Platform.sns && x.isPrimary) || null,
    relations: data.filter(
      (x: any) => ![Platform.ens, Platform.sns].includes(x.platform),
    ),
  };
  return res;
};
