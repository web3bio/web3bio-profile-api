import type { Platform } from "web3bio-profile-kit/types";

export function getCacheKeysToClear(
  platform: Platform,
  identity: string,
): string[] {
  const id = `${platform},${identity}`;
  return [
    `/ns/${platform}/${identity}`,
    `/ns/${id}`,
    `/profile/${platform}/${identity}`,
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

export function normalizeWorkerCacheUrl(
  origin: string,
  pathAndQuery: string,
): string {
  const path = pathAndQuery.startsWith("/") ? pathAndQuery : `/${pathAndQuery}`;
  const base = origin.replace(/\/$/, "");
  const url = new URL(path, `${base}/`);
  url.pathname = url.pathname.toLowerCase();
  if (url.search) {
    const sorted = new URLSearchParams(
      [...new URLSearchParams(url.search).entries()].sort((a, b) =>
        a[0].localeCompare(b[0]),
      ),
    );
    url.search = sorted.toString();
  }
  return url.toString();
}

function workerDefaultCache(): Cache | undefined {
  return (
    globalThis as unknown as { caches?: { default?: Cache } }
  ).caches?.default;
}

export async function purgeWorkerCacheUrls(
  urls: string[],
): Promise<{ ok: boolean; skipped: boolean; error?: string }> {
  if (urls.length === 0) return { ok: true, skipped: true };

  const edge = workerDefaultCache();
  if (!edge) return { ok: true, skipped: true };

  try {
    await Promise.all(
      urls.map((url) => edge.delete(new Request(url, { method: "GET" }))),
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
