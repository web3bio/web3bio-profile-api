import {
  baseURL,
  handleSearchPlatform,
  shouldPlatformFetch,
} from "@/utils/base";
import { NextRequest, NextResponse } from "next/server";
import { resolveUniversalRespondFromRelation } from "../../profile/[handle]/utils";
import { respondWithBoringSVG } from "../svg/utils";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const name = searchParams.get("handle") || "";
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
      if (/(?:\.webp)$/i.test(avatarURL))
        NextResponse.redirect(baseURL + "/avatar/process?url=" + avatarURL);
      const arrayBuffer = await fetch(avatarURL)
        .then((res) => res.arrayBuffer())
        .catch(() => null);
      if (arrayBuffer) {
        return new Response(arrayBuffer, {
          headers: {
            "Cache-Control":
              "public, s-maxage=604800, stale-while-revalidate=86400",
          },
        });
      }
    }
  }
  return respondWithBoringSVG(name, 240);
}

export const runtime = "edge";
