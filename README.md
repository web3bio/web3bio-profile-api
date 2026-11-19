# Web3.bio Profile API

Universal Identity & Domain Resolver API for Ethereum, ENS ecosystem, Lens, Farcaster, and Solana.

Web3.bio Profile API enables developers to easily and quickly integrate Web3 universal profiles from Ethereum / ENS, Farcaster, Lens, Basenames, Linea Name Service, Solana / SNS, and more into their apps. These APIs are already integrated into [Web3.bio](https://web3.bio) search and profile services.

**Live docs:** [https://api.web3.bio](https://api.web3.bio)

The REST API supports anonymous access to public data and prepaid request packs for API keys.

## Supported Platforms

Web3.bio Profile API indexes identity data from public verifiable connections and on-chain records.

- Ethereum Name Service (ENS)
- Lens Protocol
- Farcaster
- Basenames
- Celonames
- Linea Name Service
- Solana Name Service (SNS)
- Space ID
- Unstoppable Domains

## API Endpoints

Base URL: `https://api.web3.bio`

| Endpoint                             | Description                                           |
| ------------------------------------ | ----------------------------------------------------- |
| `GET /profile/{identity}`            | Universal profile across platforms                    |
| `GET /profile/{platform}/{identity}` | Platform-specific profile                             |
| `GET /profile/batch/{ids}`           | Batch profile query                                   |
| `GET /ns/{identity}`                 | Name service resolution (replace `profile` with `ns`) |
| `GET /ns/batch/{ids}`                | Batch name service query                              |
| `GET /credential/{identity}`         | Verifiable credentials                                |
| `GET /domain/{identity}`             | Domain WHOIS-style query                              |
| `GET /wallet/{identity}`             | Wallet holdings and positions                         |
| `GET /avatar/{identity}`             | Profile avatar                                        |
| `GET /avatar/svg/{identity}`         | SVG avatar                                            |
| `GET /quota`                         | Available requests for the supplied API key           |

Platform-specific routes are available under `/profile` and `/ns` for `ens`, `ethereum`, `farcaster`, `lens`, `basenames`, `linea`, `solana`, and `sns`.

See the [interactive API documentation](https://api.web3.bio) for request/response examples.

## Partner APIs

Partner endpoints return tailored response formats for third-party integrations.

| Endpoint                            | Description                                                                        |
| ----------------------------------- | ---------------------------------------------------------------------------------- |
| `GET /partner/etherscan/{identity}` | Profile data formatted for Etherscan (ENS, Lens, Farcaster, Ethereum, Solana, SNS) |

## Profile Kit

For React developers, [web3bio-profile-kit](https://www.npmjs.com/package/web3bio-profile-kit) provides hooks, types, and components for fetching and displaying Web3 profile data.

```bash
pnpm add web3bio-profile-kit
```

## API Key and Authentication

Public queries normally allow 6 requests per 10 seconds per IP. A key with prepaid credits allows 50 requests per 10 seconds across the product, subject to its endpoint permissions. To obtain a key, contact Web3.bio via [Twitter (X)](https://x.com/web3bio) or the [Telegram group](https://t.me/web3dotbio).

Send the key in the request header.

```
X-API-KEY: Bearer {API_KEY}
```

Each paid data request returning HTTP `2xx` or `404` uses one credit, including cache hits and batch queries. Other statuses release the reserved credit. At zero available credits, the request receives anonymous access and rate limits. Invalid keys return `403`. A rate-limited request returns `429` with `Retry-After`.

`GET /quota` requires a valid key and returns `{"remaining":98}` for a key with 98 available credits. This read shares the applicable rate limit and uses zero credits. After a data request, a browser can read the balance from `response.headers.get("X-Quota-Remaining")`. Available credits exclude requests still in progress. If the connection drops during settlement, check `GET /quota` after service recovers. A paid response can be committed before it reaches the client.

### Managing prepaid credits

The Durable Object name is the lowercase hex SHA-256 of the originally issued JWT, excluding the `Bearer ` prefix. Given that JWT in a local `API_KEY` variable, `printf %s "$API_KEY" | shasum -a 256` prints its object name. Call `GET /quota` with the key to initialize its ledger at zero.

In Cloudflare **Durable Objects → KeyQuota → Data Studio**, select **Name** and enter the hash. Add one row to the append-only `topups` table per purchase. Reuse the same order ID when retrying a credit. The `balance` view shows the total credited, charged, reserved and available. An abandoned request's reservation expires after five minutes. [Cloudflare Data Studio](https://developers.cloudflare.com/durable-objects/observability/data-studio/)

```sql
INSERT INTO topups (order_id, credits) VALUES ('P-1008', 10000)
ON CONFLICT (order_id) DO NOTHING;
SELECT credited, used, reserved, remaining FROM balance;
```

The Worker setting `PAID_REQUESTS_PER_10_SECONDS` controls the paid rate for every key.

Use a two-stage rollout the first time each target environment enables billing.

1. Deploy the ledger registration commit `f57870d` with `pnpm deploy`. This creates the namespace while the existing Worker still handles requests with its original permissions.
2. From the metering commit, run `pnpm staging` to upload a preview version to the same Worker. Call the preview's `GET /quota` for each existing customer key that should receive credits and the CI test key. Credit their orders in Data Studio and verify the balances on that preview.
3. Promote the verified version to 100% of traffic to activate metering. [Cloudflare version deployments](https://developers.cloudflare.com/workers/versions-and-deployments/gradual-deployments/)

## Local Development

```bash
pnpm install
pnpm dev
```

The dev server starts at [http://localhost:3000](http://localhost:3000).

For local quota testing, build with `pnpm exec opennextjs-cloudflare build` and run `pnpm exec wrangler dev --local`. Set a development `JWT_KEY` in `.dev.vars` for signed test keys.

### Environment Variables

| Variable                         | Description                                              |
| -------------------------------- | -------------------------------------------------------- |
| `GRAPHQL_SERVER`                 | Identity Graph GraphQL server URL                        |
| `PROFILE_ENDPOINT`               | Public API base URL (defaults to `https://api.web3.bio`) |
| `GENERAL_IDENTITY_GRAPH_API_KEY` | Internal API key injected by middleware                  |
| `JWT_KEY`                        | Worker secret for verifying customer keys               |

### Testing

```bash
pnpm test
```

CI runs against the deployed preview. Set the GitHub Actions secret `PROFILE_TEST_API_KEY` to a dedicated key with credits and wallet access. The existing `GENERAL_IDENTITY_GRAPH_API_KEY` secret is supported as a fallback and needs the same credits and permissions when used for testing. For local diff tests:

```bash
pnpm test:diff
```

### Deploy

Deployed to Cloudflare Workers via [OpenNext](https://opennext.js.org/cloudflare):

```bash
pnpm deploy      # production
pnpm preview     # remote preview
pnpm staging     # upload version
```

## Project Structure

```
app/api/
├── profile/     # Universal and platform profiles
├── ns/          # Name service resolution
├── credential/  # Verifiable credentials
├── domain/      # Domain queries
├── wallet/      # Wallet data
├── avatar/      # Avatar resolution
├── search/      # Search and suggestions
├── partner/     # Partner integrations
└── refresh/     # Cache refresh
```

## Contributing

Feel free to submit a pull request to propose bug fixes and improvements. You may also give feature feedback or report bugs to [Web3.bio Twitter](https://x.com/web3bio) and the [Telegram group](https://t.me/web3dotbio).

## License

[MIT](LICENSE)
