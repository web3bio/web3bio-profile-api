import { queryIdentityGraph, QueryType } from "@/utils/query";
import { resolveEipAssetURL } from "@/utils/resolver";
import {
  IdentityGraphQueryResponse,
  IdentityRecord,
  ProfileRecord,
} from "@/utils/types";
import { errorHandle, getUserHeaders, respondJson } from "@/utils/utils";
import type { NextRequest } from "next/server";
import { Platform, ErrorMessages } from "web3bio-profile-kit/types";

const SEARCH_WEB2_LIST = [
  Platform.twitter,
  Platform.github,
  Platform.discord,
  Platform.keybase,
  Platform.reddit,
  Platform.instagram,
  Platform.linkedin,
];

const isWeb2Platform = (platform: string) => {
  return SEARCH_WEB2_LIST.includes(platform as Platform);
};

const processProfileAvatar = async (
  profile: ProfileRecord,
): Promise<string | null> => {
  if (!profile?.avatar) return null;

  try {
    return await resolveEipAssetURL(profile.avatar);
  } catch {
    return null;
  }
};

const processJson = async (json: IdentityGraphQueryResponse) => {
  const _json = structuredClone(json);
  const identity = _json?.data?.identity;

  if (!identity) return _json;

  const promises: Promise<any>[] = [];

  // Process main identity avatar
  if (identity.profile) {
    promises.push(
      processProfileAvatar(identity.profile).then((processedAvatar) => {
        identity.profile.avatar = processedAvatar;
      }),
    );
  }

  const vertices: IdentityRecord[] = identity.identityGraph?.vertices || [];

  if (vertices.length > 0) {
    // Find current identity in vertices
    const currentIndex = vertices.findIndex(
      (vertex) =>
        vertex.identity === identity.identity &&
        vertex.platform === identity.platform,
    );

    // Ensure current identity is at the front
    if (currentIndex === -1) {
      // Current identity not in vertices, add it at the beginning
      const currentIdentity = { ...identity };
      delete currentIdentity.identityGraph;
      vertices.unshift(currentIdentity);
    } else if (currentIndex > 0) {
      // Current identity exists but not at front, move it to front
      const [currentIdentity] = vertices.splice(currentIndex, 1);
      vertices.unshift(currentIdentity);
    }

    // Process avatars for all vertices with profiles
    const avatarPromises = vertices
      .filter((vertex) => vertex?.profile?.avatar)
      .map(async (vertex) => {
        const processedAvatar = await processProfileAvatar(vertex.profile);
        vertex.profile.avatar = processedAvatar;
      });

    if (avatarPromises.length > 0) {
      promises.push(Promise.allSettled(avatarPromises));
    }
  }

  await Promise.allSettled(promises);
  return _json;
};

export async function GET(req: NextRequest) {
  const { searchParams, pathname } = req.nextUrl;
  const identity = searchParams.get("identity");
  const platform = searchParams.get("platform") as Platform;
  if (!identity || !platform)
    return errorHandle({
      identity: identity,
      path: pathname,
      platform: platform,
      code: 404,
      message: ErrorMessages.INVALID_IDENTITY,
    });
  const headers = getUserHeaders(req.headers);

  try {
    const res = await queryIdentityGraph(
      QueryType.GET_SEARCH_QUERY,
      identity,
      platform,
      headers,
    );

    if (res?.code || res?.errors) {
      return errorHandle({
        identity: identity,
        path: pathname,
        platform: platform,
        code: res.code,
        message: res.msg
          ? res.msg
          : res.errors
            ? JSON.stringify(res.errors)
            : ErrorMessages.NOT_FOUND,
      });
    }

    if (isSingleWeb2Identity(res.data.identity)) {
      return errorHandle({
        identity: identity,
        path: pathname,
        platform: platform || "search",
        code: 404,
        message: ErrorMessages.NOT_FOUND,
      });
    }

    const result = await processJson(res);

    return respondJson(result);
  } catch (e: unknown) {
    return errorHandle({
      identity: identity,
      path: pathname,
      platform: platform,
      message: e instanceof Error ? e.message : ErrorMessages.NOT_FOUND,
      code: e instanceof Error ? Number(e.cause) || 500 : 500,
    });
  }
}

const isSingleWeb2Identity = (identity: IdentityRecord): boolean => {
  if (!identity?.identityGraph) return true;
  if (!isWeb2Platform(identity.platform)) return false;

  const { vertices, edges } = identity.identityGraph;
  return vertices.length === 1 && edges.length === 0;
};
