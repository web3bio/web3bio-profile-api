import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { resolveIdentity } from "web3bio-profile-kit/utils";
import { refreshDomain } from "@/utils/query";
import { purgeWorkerCache } from "@/utils/cloudflare-cache";
import {
  errorHandle,
  getErrorCauseCode,
  getUserHeaders,
  invalidIdentityResponse,
  parseResolvedIdentityHandle,
} from "@/utils/utils";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const pathname = req.nextUrl.pathname;
  let decoded = (await params).id?.trim() ?? "";
  try {
    decoded = decodeURIComponent(decoded);
  } catch {
    // keep raw id when decoding fails
  }

  if (!decoded) return invalidIdentityResponse(pathname, "");

  const resolved = resolveIdentity(decoded);
  const parsed = parseResolvedIdentityHandle(resolved);
  if (!parsed) return invalidIdentityResponse(pathname, decoded);

  const [platform, identity] = parsed;
  const headers = getUserHeaders(req.headers);

  let domainRefreshStatus: unknown;
  try {
    const r = await refreshDomain(platform, identity, headers);
    if (r?.status !== undefined) {
      domainRefreshStatus = r.status;
    }
  } catch (e) {
    return errorHandle({
      identity: resolved!,
      platform,
      path: pathname,
      code: getErrorCauseCode(e),
      message: e instanceof Error ? e.message : String(e),
    });
  }

  const purge = await purgeWorkerCache(platform, identity, req.nextUrl.origin);
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
      ...(domainRefreshStatus !== undefined && { status: domainRefreshStatus }),
      cachePurged: !purge.skipped,
    },
    { status: 200, headers: { "Cache-Control": "no-store" } },
  );
}
