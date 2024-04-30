import React from "react";
import { handleSearchPlatform, shouldPlatformFetch } from "@/utils/base";
import { NextRequest, NextResponse } from "next/server";
import { resolveUniversalRespondFromRelation } from "../../profile/[handle]/utils";
import Avatar, { AvatarProps } from "boring-avatars";
const ReactDOMServer = (await import("react-dom/server")).default;

export const runtime = "edge";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const name = searchParams.get("handle") || "";
  const size = searchParams.get("size") || 160;
  const platform = handleSearchPlatform(name);
  if (shouldPlatformFetch(platform)) {
    const profiles = (await resolveUniversalRespondFromRelation({
      platform,
      handle: name,
      req,
      ns: true,
    })) as any;

    if (profiles?.length > 0) {
      const avatarURL = profiles?.find((x: any) => !!x.avatar)?.avatar;
      if (avatarURL) {
        return NextResponse.redirect(avatarURL);
      }
    }
  }

  const variant = searchParams.get("variant") || "bauhaus";
  const colors = ["#4b538b", "#15191d", "#f7a21b", "#e45635", "#d60257"];
  // const avatarHTML = ReactDOMServer.renderToString(
  //   <Avatar
  //     name={name}
  //     size={size}
  //     variant={variant as AvatarProps["variant"]}
  //     colors={colors}
  //   />
  // );
  const avatarHTML = `https://source.boringavatars.com/${variant}/${size}/${encodeURIComponent(
    name
  )}?colors=${colors.join(",")}`;
  return NextResponse.redirect(avatarHTML);
  // return new Response(avatarHTML, {
  //   headers: {
  //     "Content-Type": "image/svg+xml",
  //     "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=3600",
  //   },
  // });
}
