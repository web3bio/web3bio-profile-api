import { AuthHeaders } from "@/utils/types";
import { errorHandle, getUserHeaders, respondWithCache } from "@/utils/utils";
import type { NextRequest } from "next/server";
import { ErrorMessages } from "web3bio-profile-kit/types";

const GRAPH_API_BASE_URL = "https://graph.web3.bio/stats";

async function fetchStatsData(
  path: string,
  headers: AuthHeaders,
): Promise<any | null> {
  try {
    const response = await fetch(
      `${GRAPH_API_BASE_URL}/${encodeURIComponent(path)}`,
      {
        headers: {
          ...headers,
        },
      },
    );
    if (!response.ok) {
      console.error(
        `API request failed: ${response.status} ${response.statusText}`,
      );
      return null;
    }
    return await response.json();
  } catch (error) {
    console.error("Failed to fetch stats data:", error);
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

  if (!response || response.error) {
    const errorMessage = response?.error || ErrorMessages.NOT_FOUND;
    console.warn(`Stats not found for path: ${path}, error: ${errorMessage}`);

    return errorHandle({
      identity: path,
      code: 404,
      path: pathname,
      platform: null,
      message: ErrorMessages.NOT_FOUND,
    });
  }

  if (!response.data) {
    return errorHandle({
      identity: path,
      code: 500,
      path: pathname,
      platform: null,
      message: ErrorMessages.NOT_FOUND,
    });
  }

  return respondWithCache(JSON.stringify(response.data));
}

export const runtime = "edge";
