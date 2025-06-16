import type { NextRequest } from "next/server";
import { ErrorMessages } from "web3bio-profile-kit/types";
import { AuthHeaders } from "@/utils/types";
import { errorHandle, getUserHeaders, respondWithCache } from "@/utils/utils";

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

  if (!path) {
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

  return respondWithCache(JSON.stringify(response.data));
}

export const runtime = "edge";
