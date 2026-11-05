# Web3.bio Profile API

Universal Identity & Domain Resolver API for Ethereum, ENS ecosystem, Lens, Farcaster, and Solana.

Web3.bio Profile API enables developers to easily and quickly integrate Web3 universal profiles from Ethereum / ENS, Farcaster, Lens, Basenames, Linea Name Service, Solana / SNS, and more into their apps. These APIs are already integrated into [Web3.bio](https://web3.bio) search and profile services.

**Live docs:** [https://api.web3.bio](https://api.web3.bio)

This documentation describes the publicly available endpoints of the Web3.bio Profile API, which is a set of RESTful JSON APIs. Currently, the APIs are offered for free to assist developers in getting started with Web3 profiles.

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

Platform-specific routes are available under `/profile` and `/ns` for `ens`, `ethereum`, `farcaster`, `lens`, `basenames`, `linea`, `solana`, and `sns`.

See the [interactive API documentation](https://api.web3.bio) for request/response examples.

## Social Graph

| Endpoint | Description |
| --- | --- |
| `GET /socialgraph/{sourceId}` | Existing cross-platform recommendations |
| `POST /socialgraph/identities` | Associated accounts for 1–200 Lens/Farcaster query IDs; body: `{"queryIds":["lens,sujiyan.lens","farcaster,#12396"]}` |
| `GET /socialgraph/identities/{sourceId}` | Associated accounts for one Lens/Farcaster identity |
| `GET /socialgraph/following/{targetPlatform}/{sourceId}` | Accounts followed on the source platform that have associated accounts on the target platform |

Following supports Farcaster → Lens and Lens → Farcaster. `sourceId` is
`farcaster,{fname}` / `farcaster,#{fid}` or `lens,{username or address}`.
URL-encode `#` as `%23` when using a FID in a URL.
For following, `page` defaults to 0; `limit` defaults to 200 and accepts 1–200.
The response contains `pagination`, `queryId`, `profile`, and `following`;
each following entry contains `queryId`, `profile`, and `associatedAccounts`.
Pagination uses `limit` for the backend's `totalPage`, matching recommendations;
the API forwards these parameters and returns the backend result unchanged.
GET responses use the existing 30-day SocialGraph cache; POST batches use `no-store`.

Example: `/socialgraph/following/lens/farcaster,%2312396?page=0&limit=50`.

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

The Profile API is free, but requests without an API key are rate-limited. To obtain an API key, contact Web3.bio via [Twitter (X)](https://x.com/web3bio) or the [Telegram group](https://t.me/web3dotbio).

Include the API key in the request header:

```
X-API-KEY: Bearer {API_KEY}
```

## Local Development

```bash
pnpm install
pnpm dev
```

The dev server starts at [http://localhost:3000](http://localhost:3000).

### Environment Variables

| Variable                         | Description                                              |
| -------------------------------- | -------------------------------------------------------- |
| `GRAPHQL_SERVER`                 | Identity Graph GraphQL server URL                        |
| `PROFILE_ENDPOINT`               | Public API base URL (defaults to `https://api.web3.bio`) |
| `GENERAL_IDENTITY_GRAPH_API_KEY` | Internal API key injected by middleware                  |

### Testing

```bash
pnpm test
```

Tests run against the deployed preview URL in CI. For local diff tests:

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
