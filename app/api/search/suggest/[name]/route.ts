import type { NextRequest } from "next/server";
import { Platform } from "web3bio-profile-kit/types";
import { getQuery, postIdentityGraphQuery, QueryType } from "@/utils/query";
import { errorHandle, getErrorCauseCode, getUserHeaders, normalizeText, respondJson } from "@/utils/utils";

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
    const { data } = await postIdentityGraphQuery(headers, getQuery(QueryType.GET_SEARCH_SUGGEST), { name });
    const nameSuggest = data.nameSuggest;
    if (!Array.isArray(nameSuggest)) throw new Error("Invalid Identity Graph response");
    return respondJson(nameSuggest.map(mapSuggestItem));
  } catch (error) {
    return errorHandle({
      identity: name,
      path: req.nextUrl.pathname,
      platform: null,
      code: getErrorCauseCode(error),
      message: error instanceof Error ? error.message : "Identity Graph request failed",
    });
  }
}
