import type { NextRequest } from "next/server";
import { Platform } from "web3bio-profile-kit/types";
import { getQuery, postIdentityGraphQuery, QueryType } from "@/utils/query";
import { getUserHeaders, normalizeText, respondJson } from "@/utils/utils";

interface NameSuggest {
  name: string;
  platform: Platform;
}

function mapSuggestItem(x: NameSuggest): NameSuggest {
  return x.platform === Platform.box
    ? { platform: Platform.ens, name: x.name }
    : x;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ name: string }> },
) {
  const name = normalizeText((await params).name).trim();
  if (!name) {
    return respondJson([]);
  }

  const headers = getUserHeaders(req.headers);

  try {
    const { ok, body } = await postIdentityGraphQuery(
      headers,
      getQuery(QueryType.GET_SEARCH_SUGGEST),
      { name },
    );

    const result = body as {
      data?: { nameSuggest?: NameSuggest[] };
      errors?: unknown;
    } | null;

    if (!ok || !result || result.errors) {
      return respondJson([]);
    }

    const list: NameSuggest[] = result.data?.nameSuggest ?? [];
    return respondJson(list.map(mapSuggestItem));
  } catch {
    return respondJson([]);
  }
}
