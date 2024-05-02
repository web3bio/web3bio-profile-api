import { handleSearchPlatform, shouldPlatformFetch } from "@/utils/base";
import { NextRequest, NextResponse } from "next/server";
import { resolveUniversalRespondFromRelation } from "../../profile/[handle]/utils";

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
      if (avatarURL) {
        return NextResponse.redirect(avatarURL);
      }
    }
  }
  return NextResponse.redirect(`${process.env.NEXT_PUBLIC_PROFILE_END_POINT}/avatar/svg?handle=${name}`);
}

export const runtime = "edge";