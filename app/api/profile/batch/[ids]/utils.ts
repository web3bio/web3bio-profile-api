import {
  errorHandle,
  formatText,
  isWeb3Address,
  prettify,
  respondWithCache,
} from "@/utils/base";

import { BATCH_GET_UNIVERSAL } from "@/utils/query";
import {
  AuthHeaders,
  ErrorMessages,
  ProfileAPIResponse,
  ProfileNSResponse,
} from "@/utils/types";
import { PlatformType } from "@/utils/platform";
import {
  IDENTITY_GRAPH_SERVER,
  resolveWithIdentityGraph,
} from "../../[handle]/utils";
import { generateProfileStruct } from "@/utils/utils";

const SUPPORTED_PLATFORMS = [
  PlatformType.ens,
  PlatformType.ethereum,
  PlatformType.farcaster,
  PlatformType.lens,
  PlatformType.basenames,
  PlatformType.linea,
];

export async function handleRequest(
  ids: string[],
  headers: AuthHeaders,
  ns: boolean
) {
  if (!ids?.length)
    return errorHandle({
      identity: null,
      platform: "batch",
      code: 404,
      message: ErrorMessages.invalidIdentity,
    });
  try {
    const queryIds = filterIds(ids, true);
    const json = (await fetchIdentityGraphBatch(queryIds, ns, headers)) as any;
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

export async function fetchUniversalBatch(
  ids: string[],
  ns: boolean,
  headers: AuthHeaders
) {
  try {
    const response = await fetch(IDENTITY_GRAPH_SERVER, {
      method: "POST",
      headers: {
        ...headers,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: BATCH_GET_UNIVERSAL,
        variables: {
          ids: ids,
        },
      }),
    });

    const json = await response.json();
    if (!json || json?.code) return json;
    const res = [];
    for (let i = 0; i < json.data.identitiesWithGraph?.length; i++) {
      const item = json.data.identitiesWithGraph[i];
      const platform = item.id.split(",")[0];
      const handle = item.id.split(",")[1];
      res.push({
        id: item.id,
        aliases: item.aliases,
        profiles: await resolveWithIdentityGraph({
          platform,
          handle,
          ns,
          response: { data: { identity: { ...item } } },
        }),
      });
    }

    return res;
  } catch (e: any) {
    throw new Error(ErrorMessages.notFound, { cause: 404 });
  }
}

export async function fetchIdentityGraphBatch(
  ids: string[],
  ns: boolean,
  headers: AuthHeaders
): Promise<
  ProfileAPIResponse[] | ProfileNSResponse[] | { error: { message: string } }
> {
  try {
    const response = await fetch(IDENTITY_GRAPH_SERVER, {
      method: "POST",
      headers: {
        ...headers,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: BATCH_GET_UNIVERSAL,
        variables: {
          ids: ids,
        },
      }),
    });

    const json = await response.json();
    if (json.code) return json;
    let res = [] as any;
    if (json?.data?.identitiesWithGraph?.length > 0) {
      for (let i = 0; i < json.data.identitiesWithGraph.length; i++) {
        const item = json.data.identitiesWithGraph[i];
        if (item) {
          res.push({
            ...(await generateProfileStruct(
              item.profile || {
                platform: item.platform,
                address: item.identity,
                identity: item.identity,
                displayName: isWeb3Address(item.identity)
                  ? formatText(item.identity)
                  : item.identity,
              },
              ns,
              item.identityGraph?.edges
            )),
            aliases: item.aliases,
          });
        }
      }
    }
    return res;
  } catch (e: any) {
    throw new Error(ErrorMessages.notFound, { cause: 404 });
  }
}

export function filterIds(ids: string[], includesTwitter?: boolean) {
  const resolved = ids
    .map((x) => {
      if (
        !x.includes(",") &&
        (x.endsWith(".base") || x.endsWith(".base.eth"))
      ) {
        return `${PlatformType.basenames},${prettify(x)}`;
      }
      if (
        !x.includes(",") &&
        (x.endsWith(".linea") || x.endsWith(".linea.eth"))
      ) {
        return `${PlatformType.linea},${prettify(x)}`;
      }
      if (!x.includes(",") && x.endsWith(".farcaster")) {
        return `${PlatformType.farcaster},${prettify(x)}`;
      }
      if (!x.includes(",") && x.endsWith(".twitter")) {
        return `${PlatformType.twitter},${prettify(x)}`;
      }
      return x;
    })
    .filter((x) => {
      if (includesTwitter && x.split(",")[0] === PlatformType.twitter)
        return true;
      return (
        !!x && SUPPORTED_PLATFORMS.includes(x.split(",")[0] as PlatformType)
      );
    });
  return resolved;
}
