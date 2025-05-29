import {
  type PlatformType,
  type ProfileResponse,
  ErrorMessages,
} from "web3bio-profile-kit/types";
import { type NextRequest, NextResponse } from "next/server";
import {
  BASE_URL,
  errorHandle,
  getUserHeaders,
  shouldPlatformFetch,
} from "@/utils/utils";
import { queryIdentityGraph, QueryType } from "@/utils/query";
import { type ProfileAPIError } from "@/utils/types";
import { resolveIdentity } from "@/utils/base";

import { resolveWithIdentityGraph } from "../../profile/[handle]/utils";
import { respondWithSVG } from "../svg/[handle]/utils";

export async function GET(req: NextRequest) {
  const headers = getUserHeaders(req.headers);
  const handle = req.nextUrl.searchParams.get("handle") || "";
  const id = resolveIdentity(handle);

  if (!id) {
    return errorHandle({
      identity: handle,
      code: 404,
      platform: "avatar",
      message: ErrorMessages.INVALID_IDENTITY,
    });
  }
  const platform = id.split(",")[0] as PlatformType;
  const identity = id.split(",")[1];

  if (shouldPlatformFetch(platform)) {
    try {
      const response = await queryIdentityGraph(
        QueryType.GET_PROFILES_NS,
        identity,
        platform,
        headers,
      );

      const profiles = (await resolveWithIdentityGraph({
        handle: identity,
        platform,
        ns: true,
        response,
      })) as ProfileResponse[] | ProfileAPIError;

      if ((profiles as ProfileAPIError).message) {
        return NextResponse.json(profiles);
      }

      const profile = (profiles as ProfileResponse[])?.find((x) => !!x.avatar);
      if (!profile) {
        return respondWithSVG(id, 240);
      }

      const rawAvatarUrl = profile.avatar || "";

      // Validate URL
      try {
        new URL(rawAvatarUrl);
      } catch (e) {
        return respondWithSVG(id, 240);
      }

      // Process WebP images
      const isWebP =
        rawAvatarUrl.toLowerCase().split("?")[0].endsWith(".webp") ||
        (await (async () => {
          try {
            const response = await fetch(rawAvatarUrl, { method: "HEAD" });
            return (
              response.headers.get("content-type")?.includes("image/webp") ||
              false
            );
          } catch {
            return false;
          }
        })());

      return NextResponse.redirect(
        isWebP
          ? `${BASE_URL}/avatar/process?url=${encodeURIComponent(rawAvatarUrl)}`
          : rawAvatarUrl,
      );
    } catch (e) {
      return respondWithSVG(id, 240);
    }
  }

  return respondWithSVG(id, 240);
}

export const runtime = "edge";
