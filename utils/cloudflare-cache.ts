const CF_PURGE_CHUNK = 30;

async function purgeChunk(
  zoneId: string,
  token: string,
  files: string[],
): Promise<{ ok: boolean; error?: string }> {
  const res = await fetch(
    `https://api.cloudflare.com/client/v4/zones/${zoneId}/purge_cache`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ files }),
    },
  );

  let body: { success?: boolean; errors?: unknown } | null = null;
  try {
    body = (await res.json()) as { success?: boolean; errors?: unknown };
  } catch {
    body = null;
  }

  if (!res.ok || body?.success === false) {
    const detail =
      body?.errors != null ? JSON.stringify(body.errors) : await res.text();
    return {
      ok: false,
      error: detail || `HTTP ${res.status} ${res.statusText}`,
    };
  }

  return { ok: true };
}

export async function purgeCloudflareCacheByUrls(
  urls: string[],
): Promise<{ ok: boolean; skipped: boolean; error?: string }> {
  const zoneId = process.env.CLOUDFLARE_ZONE_ID;
  const token = process.env.CLOUDFLARE_API_TOKEN;

  if (!zoneId || !token || urls.length === 0) {
    return { ok: true, skipped: true };
  }

  for (let i = 0; i < urls.length; i += CF_PURGE_CHUNK) {
    const chunk = urls.slice(i, i + CF_PURGE_CHUNK);
    const result = await purgeChunk(zoneId, token, chunk);
    if (!result.ok) {
      return { ok: false, skipped: false, error: result.error };
    }
  }

  return { ok: true, skipped: false };
}
