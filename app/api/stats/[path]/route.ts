import type { NextRequest } from "next/server";
import { ErrorMessages } from "web3bio-profile-kit/types";
import { AuthHeaders } from "@/utils/types";
import { errorHandle, getUserHeaders, respondWithCache } from "@/utils/utils";

enum StatsPath {
  ens = "ens",
  farcaster = "farcaster",
  lens = "lens",
  basenames = "basenames",
  linea = "linea",
  web2 = "web2",
  graph = "graph",
  sns = "sns",
  box = "box",
  others = "others",
}

function isValidStatsPath(path: string): path is StatsPath {
  return Object.values(StatsPath).includes(path as StatsPath);
}
const GRAPH_API_BASE_URL = "https://graph.web3.bio/stats";

async function fetchStatsData(
  path: string,
  headers: AuthHeaders,
  refresh?: boolean,
): Promise<any | null> {
  try {
    const fetchURL = `${GRAPH_API_BASE_URL}/${path}${refresh ? "?refresh=true" : ""}`;
    const response = await fetch(fetchURL, {
      headers: {
        ...headers,
      },
    });
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const { searchParams, pathname } = req.nextUrl;
  const path = searchParams.get("path");
  const refresh = searchParams.get("refresh");
  if (!path || !isValidStatsPath(path)) {
    return errorHandle({
      identity: path,
      code: 404,
      path: pathname,
      platform: null,
      message: ErrorMessages.INVALID_IDENTITY,
    });
  }

  const headers = getUserHeaders(req.headers);
  const response = await fetchStatsData(path, headers, Boolean(refresh));

  if (!response?.data || response.error) {
    return errorHandle({
      identity: path,
      code: 404,
      path: pathname,
      platform: null,
      message: ErrorMessages.NOT_FOUND,
    });
  }

  return respondWithCache(response.data);
}

export const runtime = "edge";
