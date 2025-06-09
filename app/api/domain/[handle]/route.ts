import type { NextRequest } from "next/server";
import { ErrorMessages, Platform } from "web3bio-profile-kit/types";
import { resolveIdentity } from "web3bio-profile-kit/utils";
import { errorHandle, getUserHeaders } from "@/utils/utils";
import { resolveDomainQuery } from "./utils";

export async function GET(req: NextRequest) {
  const headers = getUserHeaders(req.headers);
  const { searchParams } = req.nextUrl;
  const handle = searchParams.get("handle") || "";
  const id = resolveIdentity(handle);
  if (!id) {
    return errorHandle({
      identity: handle,
      code: 404,
      platform: "domain",
      message: ErrorMessages.INVALID_IDENTITY,
    });
  }
  const platform = id.split(",")[0] as Platform;
  const identity = id.split(",")[1];

  return await resolveDomainQuery(identity, platform, headers);
}
export const runtime = "edge";
