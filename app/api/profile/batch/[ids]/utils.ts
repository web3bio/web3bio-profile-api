import { errorHandle, respondWithCache } from "@/utils/base";
import { queryIdentityGraphBatch } from "@/utils/query";
import { AuthHeaders, ErrorMessages } from "@/utils/types";
import { resolveIdentityBatch } from "@/utils/utils";

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
      message: ErrorMessages.invalidIdentity,
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
  } catch (e: any) {
    return errorHandle({
      identity: JSON.stringify(ids),
      platform: "batch",
      code: e.cause || 500,
      message: ErrorMessages.notFound,
    });
  }
}
