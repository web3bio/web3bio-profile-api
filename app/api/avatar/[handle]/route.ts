import {
  BASE_URL,
  getUserHeaders,
  handleSearchPlatform,
  shouldPlatformFetch,
} from "@/utils/base";
import { NextRequest, NextResponse } from "next/server";
import { respondWithSVG } from "../svg/utils";
import { resolveWithIdentityGraph } from "../../profile/[handle]/utils";
import { GET_PROFILES, queryIdentityGraph } from "@/utils/query";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const handle = searchParams.get("handle") || "";
  const headers = getUserHeaders(req);
  const platform = handleSearchPlatform(handle);
  let avatarURL = "";
  if (shouldPlatformFetch(platform)) {
    const response = await queryIdentityGraph(
      handle,
      platform,
      GET_PROFILES(false),
      headers
    );
    const profiles = (await resolveWithIdentityGraph({
      platform,
      handle,
      ns: true,
      response,
    })) as any;
    if (profiles.message) {
      return NextResponse.json(profiles);
    }
    if (profiles?.length > 0) {
      const rawAvatarUrl = profiles?.find((x: any) => !!x.avatar)?.avatar;
      try {
        new URL(rawAvatarUrl);
        avatarURL = rawAvatarUrl;
      } catch (e) {
        return respondWithSVG(handle, 240);
      }
      if (rawAvatarUrl?.includes(".webp")) {
        avatarURL = `${BASE_URL}/avatar/process?url=${encodeURIComponent(
          rawAvatarUrl
        )}`;
      }
      try {
        if (avatarURL) {
          return NextResponse.redirect(avatarURL);
        } else {
          return respondWithSVG(handle, 240);
        }
      } catch (e) {
        return respondWithSVG(handle, 240);
      }
    }
  }

  return respondWithSVG(handle, 240);
}

export const runtime = "edge";
