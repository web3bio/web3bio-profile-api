import type { NextRequest } from "next/server";
import { ErrorMessages, Platform } from "web3bio-profile-kit/types";
import { isWeb2Platform } from "web3bio-profile-kit/utils";
import { resolveEipAssetURL } from "@/utils/resolver";
import {
  IdentityGraphQueryResponse,
  IdentityRecord,
  ProfileRecord,
} from "@/utils/types";
import { errorHandle, getUserHeaders, respondJson } from "@/utils/utils";
import {
  getQuery,
  identityGraphErrorMessage,
  identityGraphErrorStatus,
  postIdentityGraphQuery,
  QueryType,
} from "@/utils/query";

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

  const avatarTasks: Promise<void>[] = [];

  if (identity.profile?.avatar) {
    avatarTasks.push(
      processProfileAvatar(identity.profile).then((processedAvatar) => {
        identity.profile.avatar = processedAvatar;
      }),
    );
  }

  const isRemovedNode = (v: IdentityRecord) =>
    v.platform === Platform.clusters && v.identity.includes("/");

  const filteredNodes = new Set(
    identity.identityGraph?.vertices
      ?.filter(isRemovedNode)
      .map((v) => `${v.platform},${v.identity}`) || [],
  );

  if (filteredNodes.size > 0 && identity.identityGraph) {
    const graph = identity.identityGraph;
    graph.vertices = graph.vertices?.filter((v) => !isRemovedNode(v));
    graph.edges = graph.edges?.filter(
      (e) => !filteredNodes.has(e.source) && !filteredNodes.has(e.target),
    );
  }

  const vertices: IdentityRecord[] = identity.identityGraph?.vertices || [];
  if (vertices.length > 0) {
    const currentIndex = vertices.findIndex(
      (v) =>
        v.identity === identity.identity && v.platform === identity.platform,
    );
    const currentKey = `${identity.platform},${identity.identity}`;

    if (currentIndex === -1 && !filteredNodes.has(currentKey)) {
      const { identityGraph, ...currentIdentity } = identity;
      vertices.unshift(currentIdentity as IdentityRecord);
    } else if (currentIndex > 0) {
      vertices.unshift(...vertices.splice(currentIndex, 1));
    }

    vertices
      .filter((v) => v?.profile?.avatar)
      .forEach((v) => {
        avatarTasks.push(
          processProfileAvatar(v.profile).then((processedAvatar) => {
            v.profile.avatar = processedAvatar;
          }),
        );
      });
  }

  if (avatarTasks.length > 0) {
    await Promise.allSettled(avatarTasks);
  }
  return _json;
};

export async function GET(req: NextRequest) {
  const { searchParams, pathname } = req.nextUrl;
  const identity = searchParams.get("identity");
  const platform = searchParams.get("platform") as Platform;
  const headers = getUserHeaders(req.headers);

  if (!identity || !platform) {
    return errorHandle({
      identity,
      path: pathname,
      platform,
      code: 404,
      message: ErrorMessages.INVALID_IDENTITY,
    });
  }
  try {
    const { ok, status, body: rawJson } = await postIdentityGraphQuery(
      headers,
      getQuery(QueryType.GET_SEARCH_QUERY),
      { identity, platform },
    );

    const envelope = rawJson as {
      code?: number;
      errors?: unknown;
      data?: { identity?: IdentityRecord };
    } | null;

    if (!ok || envelope?.code || envelope?.errors) {
      return errorHandle({
        identity,
        path: pathname,
        platform,
        code: identityGraphErrorStatus(ok, status, envelope?.code),
        message: identityGraphErrorMessage(envelope, ErrorMessages.NOT_FOUND),
      });
    }

    const graphIdentity = envelope?.data?.identity;
    if (!graphIdentity) {
      return errorHandle({
        identity,
        path: pathname,
        platform,
        code: 404,
        message: ErrorMessages.NOT_FOUND,
      });
    }

    if (isSingleWeb2Identity(graphIdentity)) {
      return errorHandle({
        identity,
        path: pathname,
        platform: platform || "graph",
        code: 404,
        message: ErrorMessages.NOT_FOUND,
      });
    }

    const result = await processJson(envelope as IdentityGraphQueryResponse);
    return respondJson(result);
  } catch (e: unknown) {
    return errorHandle({
      identity,
      path: pathname,
      platform,
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
