import { queryIdentityGraph, QueryType } from "@/utils/query";
import { BASE_URL, errorHandle, getUserHeaders } from "@/utils/utils";
import { type NextRequest, NextResponse } from "next/server";
import {
  type Platform,
  type ProfileResponse,
  ErrorMessages,
} from "web3bio-profile-kit/types";
import {
  isSupportedPlatform,
  resolveIdentity,
} from "web3bio-profile-kit/utils";
import { resolveWithIdentityGraph } from "../../profile/[handle]/utils";
import { respondWithSVG } from "../svg/[handle]/utils";

// Check if URL is WebP
async function isWebPUrl(url: string): Promise<boolean> {
  const lowerUrl = url.toLowerCase().split("?")[0];
  if (lowerUrl.endsWith(".webp")) return true;
  try {
    const response = await fetch(url, { method: "HEAD" });
    return (
      response.headers.get("content-type")?.includes("image/webp") || false
    );
  } catch {
    return false;
  }
}

// Validate URL
function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export async function GET(req: NextRequest) {
  const headers = getUserHeaders(req.headers);
  const { searchParams, pathname } = req.nextUrl;
  const handle = searchParams.get("handle") || "";
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
  const [platform, identity] = id.split(",") as [Platform, string];
  if (!isSupportedPlatform(platform)) return respondWithSVG(id, 240);
  try {
    const response = await queryIdentityGraph(
      QueryType.GET_PROFILES_NS,
      identity,
      platform,
      headers,
    );
    const profiles = await resolveWithIdentityGraph({
      handle: identity,
      platform,
      ns: true,
      response,
    });
    if ("message" in profiles) return NextResponse.json(profiles);
    const profile = (profiles as ProfileResponse[]).find((x) => x.avatar);
    if (!profile?.avatar || !isValidUrl(profile.avatar))
      return respondWithSVG(id, 240);
    const avatarUrl = profile.avatar;
    const isWebP = await isWebPUrl(avatarUrl);
    return NextResponse.redirect(
      isWebP
        ? `${BASE_URL}/avatar/process?url=${encodeURIComponent(avatarUrl)}`
        : avatarUrl,
    );
  } catch {
    return respondWithSVG(id, 240);
  }
}
