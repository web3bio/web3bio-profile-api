import type { NextRequest } from "next/server";
import { BASE_URL, errorHandle, respondWithCache } from "@/utils/utils";
import { ErrorMessages } from "web3bio-profile-kit/types";
import { resolveIdentity } from "web3bio-profile-kit/utils";

export async function GET(
  req: NextRequest,
  props: { params: Promise<{ handle: string }> },
) {
  const params = await props.params;
  const { pathname } = req.nextUrl;
  const handle = params.handle;

  if (!handle) {
    return errorHandle({
      identity: "",
      code: 400,
      path: pathname,
      platform: null,
      message: ErrorMessages.INVALID_IDENTITY,
    });
  }

  if (!resolveIdentity(handle)) {
    return errorHandle({
      identity: handle,
      code: 404,
      path: pathname,
      platform: null,
      message: ErrorMessages.INVALID_IDENTITY,
    });
  }

  const responseData = {
    ns: `${BASE_URL}/ns/${handle}`,
    profile: `${BASE_URL}/profile/${handle}`,
    domain: `${BASE_URL}/domain/${handle}`,
    credential: `${BASE_URL}/credential/${handle}`,
    avatar: `${BASE_URL}/avatar/${handle}`,
  };

  return respondWithCache(responseData);
}
