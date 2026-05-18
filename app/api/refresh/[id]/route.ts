import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import type { Platform } from "web3bio-profile-kit/types";
import { resolveIdentity } from "web3bio-profile-kit/utils";
import { refreshDomain, REFRESH_DOMAIN_PLATFORMS } from "@/utils/query";
import {
  getCacheKeysToClear,
  normalizeWorkerCacheUrl,
  purgeCloudflareCacheByUrls,
} from "@/utils/cloudflare-cache";
import {
  BASE_URL,
  errorHandle,
  getUserHeaders,
  invalidIdentityResponse,
} from "@/utils/utils";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const pathname = req.nextUrl.pathname;
  let decoded = (await params).id?.trim() ?? "";
  try {
    decoded = decodeURIComponent(decoded);
  } catch {}

  if (!decoded) return invalidIdentityResponse(pathname, "");

  const resolved = resolveIdentity(decoded);
  if (!resolved) return invalidIdentityResponse(pathname, decoded);
  const i = resolved.indexOf(",");
  const platform = resolved.slice(0, i) as Platform;
  const identity = resolved.slice(i + 1);
  const headers = getUserHeaders(req.headers);

  if (REFRESH_DOMAIN_PLATFORMS.includes(platform)) {
    try {
      await refreshDomain(platform, identity, headers);
    } catch (e) {
      const c =
        e instanceof Error &&
        e.cause &&
        typeof e.cause === "object" &&
        typeof (e.cause as { code?: unknown }).code === "number"
          ? (e.cause as { code: number }).code
          : 502;
      return errorHandle({
        identity: resolved,
        platform,
        path: pathname,
        code: c,
        message: e instanceof Error ? e.message : String(e),
      });
    }
  }

  const urls = getCacheKeysToClear(platform, identity).map((p) =>
    normalizeWorkerCacheUrl(BASE_URL, p),
  );
  const purge = await purgeCloudflareCacheByUrls(urls);
  if (!purge.ok) {
    return NextResponse.json(
      { error: purge.error ?? "Cache purge failed" },
      { status: 502, headers: { "Cache-Control": "no-store" } },
    );
  }

  return NextResponse.json(
    {
      refreshed: true,
      id: resolved,
      purgedUrls: purge.skipped ? 0 : urls.length,
      cachePurgeSkipped: purge.skipped,
    },
    { status: 200, headers: { "Cache-Control": "no-store" } },
  );
}
