# Web3.bio Profile API

Web3.bio Profile API enables developers to easily and quickly integrate Web3 universal profiles from Ethereum / ENS, Farcaster, Lens, Basenames, Linea Name Service, Solana / SNS, and more into their apps. These APIs are already integrated into Web3.bio search and profile services.

This documentation describes the publicly available endpoints of the Web3.bio Profile API, which is a set of RESTful JSON APIs. It explains how to use them and what they return. Currently, the APIs are offered for free to assist developers in getting started with Web3 profiles. We will do our best to maintain uptime.

## What are the data sources?

Web3.bio Profile API index all identity data from public verifiable connections and on-chain records.

The supported platforms are:

- Ethereum Name Service (ENS)
- Basenames
- Linea Name Service (LNS)
- Farcaster
- Lens Protocol
- Unstoppable Domains
- Solana Name Service

Queries can be found in `app/api/profile/` and `app/api/ns/`.

## Local Dev

To run the development server, use:

```
pnpm install && pnpm dev
```

## Contributing

Feel free to submit a pull request to propose bug fixes and improvements. Your help is always appreciated. You may also give feature feedback or report bugs to [Web3.bio Twitter](https://x.com/web3bio) and [Telegram group](https://t.me/web3dotbio).

test main
