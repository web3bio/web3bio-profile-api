import { formatText, isWeb3Address } from "@/utils/base";
import {
  IDENTITY_GRAPH_SERVER,
  generateProfileStruct,
} from "../[handle]/utils";
import { BATCH_GET_PROFILES } from "@/utils/query";
import {
  AuthHeaders,
  ErrorMessages,
  ProfileAPIResponse,
  ProfileNSResponse,
} from "@/utils/types";
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
        query: BATCH_GET_PROFILES,
        variables: {
          ids: ids,
        },
      }),
    });

    const json = await response.json();
    if (json.code) return json;
    let res = [] as any;
    if (json?.data?.identities?.length > 0) {
      for (let i = 0; i < json.data.identities.length; i++) {
        const item = json.data.identities[i];
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
              ns
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
