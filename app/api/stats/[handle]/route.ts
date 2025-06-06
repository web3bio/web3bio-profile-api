import { errorHandle, getUserHeaders, respondWithCache } from "@/utils/utils";
import type { NextRequest } from "next/server";
import { ErrorMessages } from "web3bio-profile-kit/types";

export async function GET(req: NextRequest) {
  const headers = getUserHeaders(req.headers);
  const { searchParams } = req.nextUrl;
  const handle = searchParams.get("handle") || "";
  console.log(handle);
  if (!handle) {
    return errorHandle({
      identity: handle,
      code: 404,
      platform: "stats",
      message: ErrorMessages.INVALID_IDENTITY,
    });
  }
  const response = await fetch(`https://graph.web3.bio/stats/${handle}`, {
    headers: {
      ...headers,
    },
  })
    .then((res) => res.json())
    .catch(null);
  if (!response || response.error) {
    return errorHandle({
      identity: handle,
      code: 404,
      platform: "stats",
      message: ErrorMessages.NOT_FOUND,
    });
  }
  return respondWithCache(JSON.stringify(response.data));
}
export const runtime = "edge";
