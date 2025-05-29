import { errorHandle, respondWithCache } from "@/utils/utils";
import { queryIdentityGraphBatch } from "@/utils/query";
import { type AuthHeaders } from "@/utils/types";
import { resolveIdentityBatch } from "@/utils/base";
import { ErrorMessages } from "web3bio-profile-kit/types";

export async function handleRequest(
  ids: string[],
  headers: AuthHeaders,
  ns: boolean,
) {
  if (!ids?.length)
    return errorHandle({
      identity: null,
      platform: "batch",
      code: 404,
      message: ErrorMessages.INVALID_IDENTITY,
    });
  try {
    const queryIds = resolveIdentityBatch(ids);
    const json = await queryIdentityGraphBatch(queryIds, ns, headers);

    if (json.code) {
      return errorHandle({
        identity: JSON.stringify(ids),
        platform: "batch",
        code: json.code,
        message: json.msg,
      });
    }
    return respondWithCache(JSON.stringify(json));
  } catch (e: unknown) {
    return errorHandle({
      identity: JSON.stringify(ids),
      platform: "batch",
      code: e instanceof Error ? Number(e.cause) : 500,
      message: ErrorMessages.NOT_FOUND,
    });
  }
}
