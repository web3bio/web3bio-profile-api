import {
  baseURL,
  handleSearchPlatform,
  respondWithCache,
  shouldPlatformFetch,
} from "@/utils/base";
import Avatar, { AvatarProps } from "boring-avatars";
import { NextRequest, NextResponse } from "next/server";
import { ImageResponse } from "next/og";

export const runtime = "edge";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const name = searchParams.get("handle") || "";
  const size = searchParams.get("size") || 160;
  const platform = handleSearchPlatform(name);
  if (shouldPlatformFetch(platform)) {
    const profiles = await fetch(baseURL + `/ns/${name}`)
      .then((res) => res.json())
      .catch((e) => null);
    if (profiles?.length > 0) {
      const avatarURL = profiles?.find((x: any) => !!x.avatar)?.avatar;
      if (avatarURL) {
        return respondWithCache(JSON.stringify(avatarURL));
      }
    }
  }
  const variant = searchParams.get("variant") || "bauhaus";
  const colors = ["#4b538b", "#15191d", "#f7a21b", "#e45635", "#d60257"];
  const avatarHTML = (
    <Avatar
      {...{
        name,
        size,
        variant: variant as AvatarProps["variant"],
        colors,
      }}
    />
  );

  return new ImageResponse(avatarHTML, {
    width: 160,
    height: 160,
    headers: {
      "Content-Type": "image/svg+xml",
    },
  });
}
