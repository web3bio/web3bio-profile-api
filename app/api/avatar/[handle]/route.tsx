import { handleSearchPlatform, shouldPlatformFetch } from "@/utils/base";
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
      const arrayBuffer = await fetch(avatarURL)
        .then((res) => res.arrayBuffer())
        .catch(() => null);
      if (arrayBuffer) {
        return new Response(arrayBuffer,{
          headers:{
            "Content-Type": "image/png",
          }
        });
      }
    }
  }
  return respondWithBoringSVG(name, 240);
}

export const runtime = "edge";
