import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createHash, randomBytes } from "node:crypto";
import { once } from "node:events";
import { createServer } from "node:http";
import { text } from "node:stream/consumers";
import { fileURLToPath } from "node:url";
import { SignJWT } from "jose";
import { createTestHarness } from "wrangler";

const { BASE_URL, GRAPHQL_SERVER, PROFILE_TEST_API_KEY } = process.env;
const graphKey = process.env.GENERAL_IDENTITY_GRAPH_API_KEY || PROFILE_TEST_API_KEY;
assert(BASE_URL && GRAPHQL_SERVER && PROFILE_TEST_API_KEY, "The preview, GraphQL endpoint and test key are required");
const quota = await fetch(new URL("/quota", BASE_URL), {
  headers: { "x-api-key": PROFILE_TEST_API_KEY },
  redirect: "error",
  signal: AbortSignal.timeout(15_000),
});
assert.equal(quota.status, 200, "Could not verify the preview test key");
assert.equal((await quota.json()).remaining, 0, "The preview test key must have zero credits");

const secret = randomBytes(32).toString("hex");
const key = await new SignJWT({ role: 8 }).setProtectedHeader({ alg: "HS256" })
  .setExpirationTime("20m").sign(new TextEncoder().encode(secret));
const keyHash = createHash("sha256").update(key).digest("hex");

// Verify the Worker forwarded its local customer key before using the graph's read credential.
const graph = createServer(async (req, res) => {
  if (req.method !== "POST" || req.url !== "/graphql") return res.writeHead(404).end();
  if (req.headers.authorization !== key) return res.writeHead(401).end();
  try {
    const response = await fetch(GRAPHQL_SERVER, {
      method: "POST",
      headers: { authorization: graphKey, "content-type": "application/json" },
      body: await text(req),
      redirect: "error",
      signal: AbortSignal.timeout(30_000),
    });
    const body = await response.text();
    res.writeHead(response.status, { "content-type": "application/json" }).end(body);
  } catch (error) {
    console.error("CI GraphQL request failed", error.message);
    res.writeHead(502).end();
  }
});

await once(graph.listen(0, "127.0.0.1"), "listening");
const server = createTestHarness({ workers: [{
  configPath: "wrangler.jsonc",
  secrets: {
    JWT_KEY: secret,
    GRAPHQL_SERVER: `http://127.0.0.1:${graph.address().port}/graphql`,
    AXIOM_API_TOKEN: "",
  },
}] });

try {
  const { url } = await server.listen();
  const worker = server.getWorker();
  await worker.applyD1Migrations("QUOTA_DB");
  const { QUOTA_DB: db } = await worker.getEnv();
  const credits = 6; // Four wallet and two Web2 requests.
  await db.prepare("INSERT INTO topups (order_id, key_hash, credits) VALUES ('ci', ?, ?)").bind(keyHash, credits).run();

  const args = process.argv.slice(2);
  const child = spawn(process.execPath, [fileURLToPath(import.meta.resolve("jest/bin/jest")), ...args], {
    stdio: "inherit",
    env: {
      ...process.env,
      PROFILE_TEST_API_KEY: "",
      GENERAL_IDENTITY_GRAPH_API_KEY: "",
      ZERO_BALANCE_TEST_API_KEY: PROFILE_TEST_API_KEY,
      PAID_TEST_BASE_URL: url.origin,
      PAID_TEST_API_KEY: key,
    },
  });
  const [code] = await once(child, "exit");
  process.exitCode = code ?? 1;
  if (code === 0) {
    const remaining = await db.prepare("SELECT remaining FROM api_keys WHERE key_hash = ?").bind(keyHash).first("remaining");
    console.info(`Isolated D1 credits remaining: ${remaining} of ${credits}`);
    if (!args.length) assert.equal(remaining, 0, "Each paid request must charge the local test key");
  }
} finally {
  await server.close();
  graph.close();
}
