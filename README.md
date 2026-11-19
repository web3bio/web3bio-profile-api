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

## API keys and limits

| Access | Request limit |
| --- | --- |
| Public requests, including keys with no credits | Normally 6 requests per 10 seconds per IP |
| Keys with prepaid credits | 50 requests per 10 seconds per key, shared across endpoints |

Send your key in the `X-API-KEY: Bearer {API_KEY}` header. To obtain a key, contact Web3.bio on [X](https://x.com/web3bio) or [Telegram](https://t.me/web3dotbio).

While your key has credits, a data request costs one credit when it returns `2xx` or `404`, including cached results. A batch of 10 profiles also costs one credit. Other responses cost zero. Once the balance reaches zero, new requests follow the public access rules. An invalid key returns `403`. If you receive `429`, wait for the number of seconds in `Retry-After` before trying again.

Use `GET /quota` with your key to check your balance. It returns a result such as `{"remaining":98}` and counts toward your rate limit, but costs zero credits. Keyed data responses include `X-Quota-Remaining` when the balance is available. If the connection drops, check your balance before retrying.

## Contributing

Feel free to submit a pull request to propose bug fixes and improvements. You may also give feature feedback or report bugs to [Web3.bio Twitter](https://x.com/web3bio) and the [Telegram group](https://t.me/web3dotbio).

## License

[MIT](LICENSE)
