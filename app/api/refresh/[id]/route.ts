import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { ErrorMessages, Platform } from "web3bio-profile-kit/types";
import { resolveIdentity } from "web3bio-profile-kit/utils";
import { refreshDomain } from "@/utils/query";
import { getCacheKeysToClear, normalizeWorkerCacheUrl } from "@/utils/cache-keys";
import { purgeCloudflareCacheByUrls } from "@/utils/cloudflare-cache";
import {
  BASE_URL,
  errorHandle,
  getUserHeaders,
  invalidIdentityResponse,
  parseResolvedIdentityHandle,
} from "@/utils/utils";

function backendRefreshErrorMessage(payload: unknown): string | null {
  if (payload == null || typeof payload !== "object") {
    return null;
  }
  const p = payload as Record<string, unknown>;
  if (typeof p.msg === "string" && p.msg.trim()) {
    return p.msg;
  }
  if (typeof p.errors === "string" && p.errors.trim()) {
    return p.errors;
  }
  if (Array.isArray(p.errors) && p.errors.length > 0) {
    return p.errors
      .map((e) =>
        typeof e === "object" &&
        e !== null &&
        "message" in e &&
        typeof (e as { message: unknown }).message === "string"
          ? (e as { message: string }).message
          : JSON.stringify(e),
      )
      .join("; ");
  }
  return null;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: rawId } = await params;
  const { pathname } = req.nextUrl;
  let decoded = rawId?.trim() ?? "";
  try {
    decoded = decodeURIComponent(decoded);
  } catch {
    /* raw segment */
  }

  if (!decoded) {
    return invalidIdentityResponse(pathname, "");
  }

  const resolved = resolveIdentity(decoded);
  const parsed = parseResolvedIdentityHandle(resolved);
  if (!parsed) {
    return invalidIdentityResponse(pathname, decoded);
  }

  const [platform, identity] = parsed;
  const compositeId = `${platform},${identity}`;
  const headers = getUserHeaders(req.headers);

  if (platform === Platform.ens) {
    const gql = await refreshDomain(platform, identity, headers);
    const gqlErr = backendRefreshErrorMessage(gql);
    if (gqlErr) {
      const httpCode =
        typeof (gql as { code?: unknown }).code === "number"
          ? (gql as { code: number }).code
          : 502;
      return errorHandle({
        identity: compositeId,
        platform,
        path: pathname,
        code: httpCode,
        message: gqlErr,
      });
    }
  }

  const relativePaths = getCacheKeysToClear(platform, identity);
  const urls = relativePaths.map((p) => normalizeWorkerCacheUrl(BASE_URL, p));

  const purge = await purgeCloudflareCacheByUrls(urls);
  if (!purge.ok) {
    return NextResponse.json(
      { error: purge.error ?? "Cache purge failed" },
      {
        status: 502,
        headers: { "Cache-Control": "no-store" },
      },
    );
  }

  return NextResponse.json(
    {
      refreshed: true,
      id: compositeId,
      purgedUrls: purge.skipped ? 0 : urls.length,
      cachePurgeSkipped: purge.skipped,
    },
    {
      status: 200,
      headers: { "Cache-Control": "no-store" },
    },
  );
}
