import React from "react";
import ReactDOMServer from "react-dom/server";
import type { NextApiRequest, NextApiResponse } from "next";
import Avatar, { AvatarProps } from "boring-avatars";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const searchParams = new URLSearchParams(req.url?.split("?")[1] || "");
  const name = searchParams.get("handle") || "";
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
  res.setHeader(
    "Cache-Control",
    "public, s-maxage=86400, stale-while-revalidate=3600"
  );
  res.setHeader("Content-Type", "image/svg+xml");
  res.end(avatarHtml);
}
