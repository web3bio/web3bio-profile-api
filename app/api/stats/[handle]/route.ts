import { errorHandle, getUserHeaders, respondWithCache } from "@/utils/utils";
import type { NextRequest } from "next/server";
import { ErrorMessages } from "web3bio-profile-kit/types";

export async function GET(req: NextRequest) {
  const headers = getUserHeaders(req.headers);
  const { searchParams, pathname } = req.nextUrl;
  const path = searchParams.get("path") || "";
  if (!path) {
    return errorHandle({
      identity: path,
      code: 404,
      path: pathname,
      platform: null,
      message: ErrorMessages.INVALID_IDENTITY,
    });
  }
  const response = await fetch(`https://graph.web3.bio/stats/${path}`, {
    headers: {
      ...headers,
    },
  })
    .then((res) => res.json())
    .catch(null);
  if (!response || response.error) {
    return errorHandle({
      identity: path,
      code: 404,
      path: req.nextUrl.pathname,
      platform: null,
      message: ErrorMessages.NOT_FOUND,
    });
  }
  return respondWithCache(JSON.stringify(response.data));
}
export const runtime = "edge";
