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
  overview = "overview",
  sns = "sns",
  box = "box",
  clusters = "clusters",
}

function isValidStatsPath(path: string): path is StatsPath {
  return Object.values(StatsPath).includes(path as StatsPath);
}
const GRAPH_API_BASE_URL = "https://graph.web3.bio/stats";

async function fetchStatsData(
  path: string,
  headers: AuthHeaders,
): Promise<any | null> {
  try {
    const response = await fetch(`${GRAPH_API_BASE_URL}/${path}`, {
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
  const response = await fetchStatsData(path, headers);

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
