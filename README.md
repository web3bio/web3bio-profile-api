# Web3.bio Profile API

Web3.bio Profile API is a Web3 Profile data service which is powered by Web3.bio. Web3.bio will provide a friendly struct of profile data when you are searching any Twitter handle, Ethereum address, ENS domain, or Lens profile.

We're gradually making updates to Web3.bio Profile API. You may expect new features and data sources.

## What are the data sources?

Web3.bio Profile API is indexing all identity data from public verifiable connections and on-chain records.

The supported platforms:

- Ethereum
- Ethereum Name Service (ENS)
- Lens
- Farcaster
- Twitter

The queries can be found here `pages/api/profile/`. Feel Free to expect new Platform support!

## Local Dev

Run the development server:

```bash
npm i && npm run dev
```

```bash
yarn && yarn dev
```

## Contributing

Feel free to submit a pull request to propose bug fixes and improvements. Help is always appreciated. You may give feature feedbacks or bug report to [Web5.bio Twitter](https://twitter.com/web3bio) as well.
