import React from "react";
import ReactDOMServer from "react-dom/server";
import type { NextApiRequest } from "next";
import Avatar, { AvatarProps } from "boring-avatars";

// use case http://localhost:3000/avatar/sujiyan.eth?colors=264653,2a9d8f,e9c46a,f4a261,e76f51&size=160&variant=sunset

export default function handler(req: NextApiRequest) {
  const searchParams = new URLSearchParams(req.url?.split("?")[1] || "");
  const name = searchParams.get("handle") || "";
  console.log(name, " handle");
  const size = searchParams.get("size") || 80;
  const variant = searchParams.get("variant") || "marble";
  const colors = searchParams.get("colors")
    ? searchParams
        .get("colors")
        ?.split(",")
        .map((color) => `#${color}`)
    : undefined;
  const avatarHtml = ReactDOMServer.renderToString(
    <Avatar
      {...{
        name,
        size,
        variant: variant as AvatarProps["variant"],
        colors,
      }}
    />
  );
  return new Response(avatarHtml, {
    status: 200,
    headers: {
      "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=3600",
      "Content-Type": "image/svg+xml",
    },
  });
}

export const config = {
  runtime: "edge",
  regions: ["sfo1", "hnd1", "sin1"],
  maxDuration: 45,
};
