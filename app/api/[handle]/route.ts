import type { NextRequest } from "next/server";
import { BASE_URL, errorHandle, respondWithCache } from "@/utils/utils";
import { ErrorMessages } from "web3bio-profile-kit/types";
import { resolveIdentity } from "web3bio-profile-kit/utils";

export async function GET(
  req: NextRequest,
  { params }: { params: { handle: string } },
) {
  const { pathname } = req.nextUrl;
  const handle = params.handle;

  // Early return for empty handle
  if (!handle) {
    return errorHandle({
      identity: "",
      code: 400,
      path: pathname,
      platform: null,
      message: ErrorMessages.INVALID_IDENTITY,
    });
  }

  const id = resolveIdentity(handle);
  if (!id) {
    return errorHandle({
      identity: handle,
      code: 404,
      path: pathname,
      platform: null,
      message: ErrorMessages.INVALID_IDENTITY,
    });
  }

  // Build response object directly
  const responseData = {
    ns: `${BASE_URL}/ns/${handle}`,
    profile: `${BASE_URL}/profile/${handle}`,
    domain: `${BASE_URL}/domain/${handle}`,
    credentials: `${BASE_URL}/credentials/${handle}`,
    avatar: `${BASE_URL}/avatar/${handle}`,
  };

  return respondWithCache(responseData);
}

export const runtime = "edge";
