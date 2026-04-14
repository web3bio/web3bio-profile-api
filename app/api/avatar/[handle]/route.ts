import { queryIdentityGraph, QueryType } from "@/utils/query";
import { errorHandle, getUserHeaders, IMAGE_API_ENDPOINT } from "@/utils/utils";
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

const AVATAR_SIZE = 240;

const parseAvatarHandle = (
  rawHandle: string,
): { id: string; platform: Platform; identity: string } | null => {
  const id = resolveIdentity(rawHandle?.trim());
  if (!id) {
    return null;
  }

  const [platform, identity] = id.split(",") as [Platform, string];
  return platform && identity ? { id, platform, identity } : null;
};

const isProfileError = (value: unknown): value is { message: unknown } =>
  !!value && typeof value === "object" && "message" in value;

async function isWebPUrl(url: string): Promise<boolean> {
  const normalizedUrl = url.toLowerCase().split("?")[0];
  if (normalizedUrl.endsWith(".webp")) {
    return true;
  }
  try {
    const response = await fetch(url, { method: "HEAD" });
    return (
      response.headers.get("content-type")?.includes("image/webp") || false
    );
  } catch {
    return false;
  }
}

function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export async function GET(
  req: NextRequest,
  props: { params: Promise<{ handle: string }> },
) {
  const { handle } = await props.params;
  const parsed = parseAvatarHandle(handle);
  const fallbackId = handle?.trim() ?? "";
  if (!parsed) {
    return errorHandle({
      identity: fallbackId,
      code: 404,
      path: req.nextUrl.pathname,
      platform: null,
      message: ErrorMessages.INVALID_IDENTITY,
    });
  }

  const { pathname } = req.nextUrl;
  const headers = getUserHeaders(req.headers);
  const { id, platform, identity } = parsed;
  if (!isSupportedPlatform(platform)) {
    return respondWithSVG(id, AVATAR_SIZE);
  }
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
    if (isProfileError(profiles)) {
      return NextResponse.json(profiles);
    }
    const profile = (profiles as ProfileResponse[]).find((x) => x.avatar);
    if (!profile?.avatar || !isValidUrl(profile.avatar)) {
      return respondWithSVG(id, AVATAR_SIZE);
    }
    const avatarUrl = profile.avatar;
    const isWebP = await isWebPUrl(avatarUrl);
    return NextResponse.redirect(
      isWebP
        ? `${IMAGE_API_ENDPOINT}/?url=${encodeURIComponent(avatarUrl)}&og`
        : avatarUrl,
    );
  } catch {
    return respondWithSVG(id, AVATAR_SIZE);
  }
}
