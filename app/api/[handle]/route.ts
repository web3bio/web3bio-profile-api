import { resolveIdentity } from "@/utils/base";
import { ErrorMessages } from "@/utils/types";
import { BASE_URL, errorHandle, respondWithCache } from "@/utils/utils";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const handle = searchParams.get("handle") || "";
  const id = resolveIdentity(handle);
  if (!id) {
    return errorHandle({
      identity: handle,
      code: 404,
      platform: "universal",
      message: ErrorMessages.invalidIdentity,
    });
  }

  return respondWithCache(
    JSON.stringify({
      ns: `${BASE_URL}/ns/${handle}`,
      profile: `${BASE_URL}/profile/${handle}`,
      domain: `${BASE_URL}/domain/${handle}`,
      credentials: `${BASE_URL}/credentials/${handle}`,
      avatar: `${BASE_URL}/avatar/${handle}`,
    }),
  );
}
export const runtime = "edge";
