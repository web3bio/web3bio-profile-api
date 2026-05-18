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
