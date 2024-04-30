import {
  handleSearchPlatform,
  respondWithCache,
  shouldPlatformFetch,
} from "@/utils/base";
import Avatar, { AvatarProps } from "boring-avatars";
import { NextRequest } from "next/server";
import { resolveUniversalRespondFromRelation } from "../../profile/[handle]/utils";

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
        return new Response(avatarURL,{
          headers: {
            "Content-Type": "text/plain",
            "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=3600",
          },
        })
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

  return new Response("test123", {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=3600",
    },
  });
}
