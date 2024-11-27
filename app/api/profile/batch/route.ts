import { errorHandle, getUserHeaders, respondWithCache } from "@/utils/base";
import { NextRequest } from "next/server";
import { fetchIdentityGraphBatch } from "./utils";
import { PlatformType } from "@/utils/platform";
import { ErrorMessages } from "@/utils/types";

const filterIds = (ids: string[]) =>
  ids.filter((x: string) => {
    return [
      PlatformType.ens,
      PlatformType.basenames,
      PlatformType.ethereum,
      PlatformType.lens,
      PlatformType.farcaster,
    ].includes(x.split(",")[0] as PlatformType);
  });

export async function POST(req: NextRequest) {
  const { ids } = await req.json();
  const headers = getUserHeaders(req);
  if (!ids?.length)
    return errorHandle({
      identity: null,
      platform: "batch",
      code: 404,
      message: ErrorMessages.invalidIdentity,
    });
  try {
    const queryIds = filterIds(ids);
    const json = (await fetchIdentityGraphBatch(
      queryIds,
      false,
      headers
    )) as any;
    if (json.code) {
      return errorHandle({
        identity: JSON.stringify(ids),
        platform: "batch",
        code: json.code,
        message: json.msg,
      });
    }
    return respondWithCache(JSON.stringify(json));
  } catch (e: any) {
    return errorHandle({
      identity: JSON.stringify(ids),
      platform: "batch",
      code: e.cause || 500,
      message: ErrorMessages.notFound,
    });
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const headers = getUserHeaders(req);
  const ids = searchParams.get("ids")?.split(",") || [];
  if (!ids?.length)
    return errorHandle({
      identity: null,
      platform: "batch",
      code: 404,
      message: ErrorMessages.invalidIdentity,
    });
  try {
    const mergedIds = [];
    for (let i = 0; i < ids.length; i += 2) {
      mergedIds.push(`${ids[i]},${ids[i + 1]}`);
    }
    const queryIds = filterIds(mergedIds);
    const json = (await fetchIdentityGraphBatch(
      queryIds,
      false,
      headers
    )) as any;
    if (json.code) {
      return errorHandle({
        identity: JSON.stringify(ids),
        platform: "batch",
        code: json.code,
        message: json.msg,
      });
    }
    return respondWithCache(JSON.stringify(json));
  } catch (e: any) {
    return errorHandle({
      identity: JSON.stringify(ids),
      platform: "batch",
      code: e.cause || 500,
      message: ErrorMessages.notFound,
    });
  }
}

export const runtime = "edge";
