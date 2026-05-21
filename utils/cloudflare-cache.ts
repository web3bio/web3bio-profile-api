import type { Platform } from "web3bio-profile-kit/types";

function sortedSearch(search: string): string {
  const raw = search.startsWith("?") ? search.slice(1) : search;
  if (!raw) return "";
  const qs = new URLSearchParams(
    [...new URLSearchParams(raw).entries()].sort((a, b) =>
      a[0].localeCompare(b[0]),
    ),
  ).toString();
  return qs ? `?${qs}` : "";
}

/** Worker cache key: request origin + lowercase path + sorted query. */
export function workerCacheKey(
  input: URL | string,
  base?: string | URL,
): Request {
  const url =
    typeof input === "string" && input.startsWith("/")
      ? new URL(input, base)
      : new URL(input);
  const path = url.pathname.toLowerCase();
  return new Request(`${url.origin}${path}${sortedSearch(url.search)}`, {
    method: "GET",
  });
}

export function getCacheKeysToClear(
  platform: Platform,
  identity: string,
): string[] {
  const id = `${platform},${identity}`;
  return [
    `/ns/${platform}/${identity}`,
    `/ns/${identity}`,
    `/ns/${id}`,
    `/profile/${platform}/${identity}`,
    `/profile/${identity}`,
    `/profile/${id}`,
    `/domain/${identity}`,
    `/domain/${id}`,
    `/avatar/${identity}`,
    `/avatar/${id}`,
    `/credential/${identity}`,
    `/credential/${id}`,
    `/wallet/${identity}`,
    `/wallet/${id}`,
    `/search?identity=${encodeURIComponent(identity)}&platform=${platform}`,
  ];
}

function workerCache(): Cache | undefined {
  return (
    globalThis as unknown as { caches?: { default?: Cache } }
  ).caches?.default;
}

export async function purgeWorkerCache(
  platform: Platform,
  identity: string,
  base: string | URL,
): Promise<{ ok: boolean; skipped: boolean; error?: string }> {
  return purgeWorkerCachePaths(getCacheKeysToClear(platform, identity), base);
}

export async function purgeWorkerCachePaths(
  paths: string[],
  base: string | URL,
): Promise<{ ok: boolean; skipped: boolean; error?: string }> {
  if (paths.length === 0) return { ok: true, skipped: true };

  const cache = workerCache();
  if (!cache) return { ok: true, skipped: true };

  try {
    await Promise.all(
      paths.map((path) => cache.delete(workerCacheKey(path, base))),
    );
    return { ok: true, skipped: false };
  } catch (e) {
    return {
      ok: false,
      skipped: false,
      error: e instanceof Error ? e.message : String(e),
    };
  }
}
