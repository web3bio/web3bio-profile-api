import {
  baseURL,
  handleSearchPlatform,
  shouldPlatformFetch,
} from "@/utils/base";
import { NextRequest } from "next/server";
import { resolveUniversalRespondFromRelation } from "../../profile/[handle]/utils";
import { respondWithSVG } from "../svg/utils";

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
      const rawAvatarUrl = profiles?.find((x: any) => !!x.avatar)?.avatar;
      let avatarURL = rawAvatarUrl;
      if (avatarURL?.includes(".webp")) {
        avatarURL = `${baseURL}/avatar/process?url=${encodeURIComponent(
          rawAvatarUrl
        )}`;
      }
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
  return respondWithSVG(name, 240);
}

export const runtime = "edge";
