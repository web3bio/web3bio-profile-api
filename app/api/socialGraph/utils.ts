import type { NextRequest } from "next/server";
import { ErrorMessages, Platform } from "web3bio-profile-kit/types";
import {
  getQuery,
  identityGraphErrorMessage,
  identityGraphErrorStatus,
  postIdentityGraphQuery,
  QueryType,
} from "@/utils/query";
import { errorHandle, getUserHeaders, respondJson } from "@/utils/utils";

type SocialGraphKind = "following" | "recommendations";

interface SocialVertex {
  id: string;
  identity: string;
  platform: Platform;
  displayName: string | null;
  avatar: string | null;
}

interface SocialEdge {
  source: string;
  target: string;
  dataSource: Platform;
  edgeType: string;
  recommendReason: string | null;
  updatedAt: number | null;
}

interface SocialGraphResult {
  pagination: {
    total: number;
    page: number;
    totalPage: number;
    hasMore: boolean;
  } | null;
  source: SocialVertex;
  vertices: SocialVertex[];
  edges: SocialEdge[];
}

const SUPPORTED_PLATFORMS = new Set([
  Platform.twitter,
  Platform.farcaster,
  Platform.lens,
]);

const parseInteger = (value: string | null, fallback: number) =>
  value === null ? fallback : /^\d+$/.test(value) ? Number(value) : NaN;

const getPagination = (
  graph: SocialGraphResult,
  page: number,
  pageSize: number,
) => ({
  total: graph.pagination?.total ?? 0,
  page: graph.pagination?.page ?? page,
  pageSize: graph.pagination?.totalPage ?? pageSize,
  hasMore: graph.pagination?.hasMore ?? false,
});

const getTarget = (id: string, platform: Platform): SocialVertex => {
  const separator = id.indexOf(",");
  return {
    id,
    identity: separator < 0 ? id : id.slice(separator + 1),
    platform: separator < 0 ? platform : (id.slice(0, separator) as Platform),
    displayName: null,
    avatar: null,
  };
};

export async function getSocialGraph(
  req: NextRequest,
  kind: SocialGraphKind,
) {
  const { pathname, searchParams } = req.nextUrl;
  const identity = searchParams.get("identity")?.trim() || null;
  const platform = (searchParams.get("platform")?.trim() || null) as Platform | null;
  const fail = (code: number, message: string) =>
    errorHandle({ identity, path: pathname, platform, code, message });

  if (!identity || identity.includes(",") || !platform) {
    return fail(400, ErrorMessages.INVALID_IDENTITY);
  }
  if (!SUPPORTED_PLATFORMS.has(platform)) {
    return fail(400, "Unsupported platform");
  }
  if (kind === "following" && platform !== Platform.twitter) {
    return fail(400, "Following graph is currently available for twitter only");
  }

  const page = parseInteger(searchParams.get("page"), 0);
  const pageSize = parseInteger(searchParams.get("pageSize"), 20);
  if (
    !Number.isSafeInteger(page) ||
    page < 0 ||
    !Number.isSafeInteger(pageSize) ||
    pageSize < 1 ||
    pageSize > 100
  ) {
    return fail(400, "Invalid pagination");
  }

  const queryType =
    kind === "following"
      ? QueryType.GET_SOCIAL_GRAPH
      : QueryType.GET_SOCIAL_GRAPH_RECOMMENDATIONS;
  const variables =
    kind === "following"
      ? { handle: identity, page, totalPage: pageSize }
      : {
          sourceId: `${platform},${identity}`,
          recommendPlatform: platform,
          page,
          totalPage: pageSize,
        };

  try {
    const { ok, status, body } = await postIdentityGraphQuery(
      getUserHeaders(req.headers),
      getQuery(queryType),
      variables,
    );
    const envelope = body as {
      code?: number;
      errors?: unknown;
      data?: {
        twitterSocialSearch?: SocialGraphResult;
        socialGraphCrossPlatformRecommendation?: SocialGraphResult;
      };
    } | null;

    if (!ok || envelope?.code || envelope?.errors) {
      return fail(
        identityGraphErrorStatus(ok, status, envelope?.code),
        identityGraphErrorMessage(envelope, ErrorMessages.NOT_FOUND),
      );
    }

    const graph =
      kind === "following"
        ? envelope?.data?.twitterSocialSearch
        : envelope?.data?.socialGraphCrossPlatformRecommendation;
    if (!graph?.source) {
      return fail(404, ErrorMessages.NOT_FOUND);
    }

    const pagination = getPagination(graph, page, pageSize);
    if (kind === "following") {
      const vertices = graph.vertices.some(
        (vertex) => vertex.id === graph.source.id,
      )
        ? graph.vertices
        : [graph.source, ...graph.vertices];
      const socialGraph = {
        source: graph.source,
        vertices,
        edges: graph.edges,
        pagination,
      };
      return respondJson({ data: { socialGraph } }, platform);
    }

    const vertices = new Map(graph.vertices.map((vertex) => [vertex.id, vertex]));
    const items = graph.edges.map((edge) => ({
      target: vertices.get(edge.target) ?? getTarget(edge.target, platform),
      recommendReason: edge.recommendReason,
      updatedAt: edge.updatedAt,
    }));
    const recommendations = { source: graph.source, items, pagination };
    return respondJson({ data: { recommendations } }, platform);
  } catch (error: unknown) {
    return fail(
      error instanceof Error ? Number(error.cause) || 500 : 500,
      error instanceof Error ? error.message : ErrorMessages.NOT_FOUND,
    );
  }
}
