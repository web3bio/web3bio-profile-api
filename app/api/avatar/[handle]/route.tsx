import {
  baseURL,
  handleSearchPlatform,
  shouldPlatformFetch,
} from "@/utils/base";
import Avatar, { AvatarProps } from "boring-avatars";
import { NextRequest, NextResponse } from "next/server";
import satori from "satori";

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
        return NextResponse.json(avatarURL);
      }
    }
  }
  const variant = searchParams.get("variant") || "bauhaus";
  const colors = ["#4b538b", "#15191d", "#f7a21b", "#e45635", "#d60257"];
  const avatarHTML = satori(
    <Avatar
      {...{
        name,
        size,
        variant: variant as AvatarProps["variant"],
        colors,
      }}
    />,
    {
      width: Number(size) || 160,
      height: Number(size) || 160,
      fonts: [],
    }
  );
  return NextResponse.json(avatarHTML, {
    headers: {
      "Content-Type": "image/svg+xml",
    },
  });
}
