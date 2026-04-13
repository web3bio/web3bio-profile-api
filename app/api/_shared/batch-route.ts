import { ErrorMessages } from "web3bio-profile-kit/types";
import { errorHandle } from "@/utils/utils";

export const parseIdsParam = (idsParam: string): string[] | null => {
  const ids = JSON.parse(decodeURIComponent(idsParam));
  return Array.isArray(ids) ? ids : null;
};

export const invalidBatchIdentityResponse = (
  pathname: string,
  identity: string,
  code = 400,
) =>
  errorHandle({
    identity,
    path: pathname,
    platform: null,
    code,
    message: ErrorMessages.INVALID_IDENTITY,
  });
