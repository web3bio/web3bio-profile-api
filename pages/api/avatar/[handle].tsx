import React from "react";
import ReactDOMServer from "react-dom/server";
import type { NextApiRequest } from "next";
import Avatar, { AvatarProps } from "boring-avatars";
import {
  baseURL,
  handleSearchPlatform,
  shouldPlatformFetch,
} from "@/utils/base";
import { respondWithCache } from "@/utils/base";

export default async function handler(req: NextApiRequest) {
  const searchParams = new URLSearchParams(req.url?.split("?")[1] || "");
  const name = searchParams.get("handle") || "";
  const size = searchParams.get("size") || 160;
  const platform = handleSearchPlatform(name);
  if (shouldPlatformFetch(platform)) {
    const profiles = (await fetch(baseURL + `/ns/${name}`)
      .then((res) => res.json())
      .catch((e) => null)) as any;
    if (profiles?.length > 0) {
      const avatarURL = profiles?.find(
        (x: { avatar: string | null }) => x.avatar !== null
      )?.avatar;
      if (avatarURL) {
        return respondWithCache(avatarURL, {
          "Content-Type": "application/json",
        });
      }
    }
  }

  // const variant = searchParams.get("variant") || "bauhaus";
  // const colors = ["#4b538b", "#15191d", "#f7a21b", "#e45635", "#d60257"];

  // const avatarHTML = ReactDOMServer.renderToString(
  //   <Avatar
  //     {...{
  //       name,
  //       size,
  //       variant: variant as AvatarProps["variant"],
  //       colors,
  //     }}
  //   />
  // );
  // return respondWithCache(avatarHTML, { "Content-Type": "image/svg+xml" });
}

export const config = {
  runtime: "edge",
  regions: ["sfo1", "iad1", "pdx1"],
};
