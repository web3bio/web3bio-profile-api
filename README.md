# Web3.bio Profile API

Web3.bio Profile API is a Web3 Profile data service powered by Web3.bio. When searching for any Ethereum address, ENS domain, Lens profile, or Farcaster usernames, it provides a user-friendly structure of profile data.

We are constantly updating the Web3.bio Profile API, so expect new features and data sources.

## What are the data sources?

Web3.bio Profile API indexes all identity data from public verifiable connections and on-chain records.

The supported platforms are:

- Ethereum
- Ethereum Name Service (ENS)
- Lens Protocol
- Farcaster
- Unstoppable Domains
- .bit

Queries can be found in `pages/api/profile/` and `pages/api/ns/`.

## Local Dev

To run the development server, use:

```
yarn && yarn dev
```

## Contributing

Feel free to submit a pull request to propose bug fixes and improvements. Your help is always appreciated. You may also give feature feedback or report bugs to [Web3.bio Twitter](https://twitter.com/web3bio) and [Telegram group](https://t.me/web3dotbio).