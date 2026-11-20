const NOW = "unixepoch('subsec')";

// One transaction on the primary decides access and records a rate-limit hit, without spending a credit.
export async function admitKey(db, keyHash, limit) {
  const requestId = crypto.randomUUID();
  const offset = Number(limit) - 1;
  if (!Number.isSafeInteger(offset) || offset < 0) throw new Error("Invalid paid request limit");

  const [, , state] = await db.batch([
    db.prepare(`DELETE FROM quota_requests WHERE id IN (
      SELECT id FROM quota_requests WHERE expires_at <= ${NOW} ORDER BY expires_at LIMIT 8
    )`),
    db.prepare(`INSERT INTO quota_requests (id, key_hash, started_at, expires_at)
      SELECT ?1, key_hash, ${NOW}, ${NOW} + 10 FROM api_keys WHERE key_hash = ?2 AND remaining > 0
      AND NOT EXISTS (SELECT 1 FROM quota_requests WHERE key_hash = ?2
        AND started_at > ${NOW} - 10 LIMIT 1 OFFSET ?3)`).bind(requestId, keyHash, offset),
    db.prepare(`SELECT remaining,
      CASE WHEN remaining > 0 AND NOT EXISTS (SELECT 1 FROM quota_requests WHERE id = ?3)
        THEN (SELECT started_at + 10 - ${NOW} FROM quota_requests WHERE key_hash = ?1
          ORDER BY started_at DESC LIMIT 1 OFFSET ?2) END AS retry_in
      FROM api_keys WHERE key_hash = ?1`).bind(keyHash, offset, requestId),
  ]);
  const { remaining = 0, retry_in: retryIn } = state.results[0] ?? {};
  const retryAfter = retryIn == null ? 0 : Math.max(1, Math.ceil(retryIn));
  return { remaining, retryAfter, requestId };
}

export async function chargeKey(db, keyHash, requestId) {
  const deadline = Date.now() / 1000 + 60;
  // A slow response can outlive its admission. Both attempts share one receipt and expiry.
  const statements = [
    db.prepare(`INSERT OR IGNORE INTO quota_requests (id, key_hash)
      SELECT ?1, ?2 WHERE ${NOW} < ?3`).bind(requestId, keyHash, deadline),
    db.prepare(`UPDATE quota_requests SET billable = 1, expires_at = ?1
      WHERE id = ?2 AND billable IS NULL AND ${NOW} < ?1`).bind(deadline, requestId),
    db.prepare(`SELECT k.remaining FROM quota_requests r JOIN api_keys k ON k.key_hash = r.key_hash
      WHERE r.id = ? AND r.billable = 1`).bind(requestId),
  ];
  let results;
  try {
    results = await db.batch(statements);
  } catch {
    results = await db.batch(statements);
  }
  return results[2].results[0]?.remaining ?? null;
}
