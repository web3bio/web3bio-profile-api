import React from "react";
import ReactDOMServer from "react-dom/server";
import type { NextApiRequest } from "next";
import Avatar, { AvatarProps } from "boring-avatars";
import {
  baseURL,
  handleSearchPlatform,
  shouldPlatformFetch,
} from "@/utils/base";

export default async function handler(req: NextApiRequest) {
  const searchParams = new URLSearchParams(req.url?.split("?")[1] || "");
  let avatarHTML = "";
  let shouldReturnBoring = false;
  const name = searchParams.get("handle") || "";
  const size = searchParams.get("size") || 160;
  const platform = handleSearchPlatform(name);
  if (shouldPlatformFetch(platform)) {
    const profiles = fetch(baseURL + `/ns/${name}`)
      .then((res) => res.json())
      .catch((e) => null) as any;
    avatarHTML = profiles[0]?.avatar;
    // if (profiles?.length > 0) {
    //   const avatarURL = profiles?.find(
    //     (x: { avatar: string | null }) => x.avatar !== null
    //   )?.avatar;
    //   if (avatarURL) {
    //     avatarHTML = avatarURL;
    //   }
    // }
  }
  if (!avatarHTML) {
    shouldReturnBoring = true;
    const variant = searchParams.get("variant") || "bauhaus";
    const colors = ["#4b538b", "#15191d", "#f7a21b", "#e45635", "#d60257"];

    avatarHTML = ReactDOMServer.renderToString(
      <Avatar
        {...{
          name,
          size,
          variant: variant as AvatarProps["variant"],
          colors,
        }}
      />
    );
  }
  return new Response(avatarHTML, {
    status: 200,
    headers: {
      "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=3600",
      "Content-Type": shouldReturnBoring ? "image/svg+xml" : "text/plain",
    },
  });
}

export const config = {
  runtime: "edge",
  regions: ["sfo1", "iad1", "pdx1"],
};
