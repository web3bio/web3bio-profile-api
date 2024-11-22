import {
  BASE_URL,
  getUserHeaders,
  handleSearchPlatform,
  shouldPlatformFetch,
} from "@/utils/base";
import { NextRequest, NextResponse } from "next/server";
import { respondWithSVG } from "../svg/utils";
import { resolveWithIdentityGraph } from "../../profile/[handle]/utils";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const name = searchParams.get("handle") || "";
  const headers = getUserHeaders(req);
  const platform = handleSearchPlatform(name);
  let avatarURL = "";
  if (shouldPlatformFetch(platform)) {
    const profiles = (await resolveWithIdentityGraph({
      platform,
      handle: name,
      ns: true,
      headers: {
        ...headers,
        authorization: process.env.NEXT_PUBLIC_IDENTITY_GRAPH_API_KEY || "",
      },
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
        return respondWithSVG(name, 240);
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
          return respondWithSVG(name, 240);
        }
      } catch (e) {
        return respondWithSVG(name, 240);
      }
    }
  }

  return respondWithSVG(name, 240);
}

export const runtime = "edge";
