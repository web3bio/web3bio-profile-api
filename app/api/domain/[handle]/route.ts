import { ErrorMessages } from "@/utils/types";
import { errorHandle, getUserHeaders } from "@/utils/utils";
import { NextRequest } from "next/server";
import { resolveIdentity } from "@/utils/base";
import { PlatformType } from "@/utils/platform";
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
      message: ErrorMessages.invalidIdentity,
    });
  }
  const platform = id.split(",")[0] as PlatformType;
  const identity = id.split(",")[1];

  return await resolveDomainQuery(identity, platform, headers);
}
export const runtime = "edge";
