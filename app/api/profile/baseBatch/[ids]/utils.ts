import { ErrorMessages } from "web3bio-profile-kit/types";
import { resolveIdentityBatch } from "@/utils/base";
import { getQuery, queryIdentityGraphBatch, QueryType } from "@/utils/query";
import { type AuthHeaders } from "@/utils/types";
import {
  errorHandle,
  IDENTITY_GRAPH_SERVER,
  respondWithCache,
} from "@/utils/utils";

export async function handleOrininalbatch(
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
    const response = await fetch(IDENTITY_GRAPH_SERVER, {
      method: "POST",
      headers: {
        ...headers,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: getQuery(QueryType.GET_BATCH),
        variables: { ids: queryIds },
      }),
    })
      .then((res) => res.json())
      .catch(null);

    const resJson = response.data.identities.map((x: any) => {
      const _profile = x.profile;
      return {
        address: _profile.address,
        identity: _profile.identity,
        platform: _profile.platform,
        displayName: _profile.displayName,
        avatar: _profile.avatar,
        description: _profile.description,
        aliases: x.aliases,
      };
    });

    return respondWithCache(JSON.stringify(resJson));
  } catch (e: unknown) {
    return errorHandle({
      identity: JSON.stringify(ids),
      platform: "batch",
      code: e instanceof Error ? Number(e.cause) : 500,
      message: ErrorMessages.NOT_FOUND,
    });
  }
}
