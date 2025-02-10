// sources.ts
export enum SourceType {
  ethereum = "ethereum",
  ens = "ens",
  twitter = "twitter",
  keybase = "keybase",
  sybil = "sybil",
  nextid = "nextid",
  rss3 = "rss3",
  knn3 = "knn3",
  cyberconnect = "cyberconnect",
  ethLeaderboard = "ethLeaderboard",
  the_graph = "the_graph",
  rpc_server = "rpc_server",
  dotbit = "dotbit",
  unstoppabledomains = "unstoppabledomains",
  lens = "lens",
  farcaster = "farcaster",
  space_id = "space_id",
  crossbell = "crossbell",
  clusters = "clusters",
  solana = "solana",
  sns = "sns",
  opensea = "opensea",
  twitter_hexagon = "twitter_hexagon",
  firefly = "firefly",
  pfp = "pfp",
  manually_added = "manually_added",
  basenames = "basenames",
  dentity = "dentity",
  nftd = "nftd",
  mirror = "mirror",
  paragraph = "paragraph",
  foundation = "foundation",
  rarible = "rarible",
  soundxyz = "soundxyz",
  gravity = "gravity",
  linea = "linea",
  gmgn = "gmgn",
  nostr = "nostr",
  talentprotocol = "talentprotocol",
  firefly_campaigns = "firefly_campaigns",
  mask_campaigns = "mask_campaigns",
  crowdsourcing = "crowdsourcing",
}

interface SourceInfo {
  name: string;
  description: string;
}

export const SOURCE_DATA: Readonly<Record<SourceType, SourceInfo>> = {
  [SourceType.ethereum]: {
    name: "Ethereum",
    description: "Ethereum",
  },
  [SourceType.ens]: {
    name: "ENS",
    description: "Ethereum Name Service",
  },
  [SourceType.twitter]: {
    name: "Twitter (X)",
    description: "Twitter (X) social platform",
  },
  [SourceType.keybase]: {
    name: "Keybase",
    description: "Secure messaging and file-sharing",
  },
  [SourceType.sybil]: {
    name: "Sybil",
    description: "Ethereum social verification",
  },
  [SourceType.nextid]: {
    name: "Next.ID",
    description: "Decentralized identity protocol",
  },
  [SourceType.rss3]: {
    name: "RSS3",
    description: "Open information syndication protocol",
  },
  [SourceType.knn3]: {
    name: "KNN3",
    description: "Web3 data network",
  },
  [SourceType.cyberconnect]: {
    name: "CyberConnect",
    description: "Decentralized social graph protocol",
  },
  [SourceType.ethLeaderboard]: {
    name: "ETH Leaderboard",
    description: "Ethereum address ranking",
  },
  [SourceType.the_graph]: {
    name: "Ethereum",
    description: "via The Graph indexing protocol",
  },
  [SourceType.rpc_server]: {
    name: "RPC Server",
    description: "Remote Procedure Call server",
  },
  [SourceType.dotbit]: {
    name: ".bit",
    description: "Decentralized cross-chain identity system",
  },
  [SourceType.unstoppabledomains]: {
    name: "Unstoppable Domains",
    description: "Blockchain domain name provider",
  },
  [SourceType.lens]: {
    name: "Lens",
    description: "Web3 social graph protocol",
  },
  [SourceType.farcaster]: {
    name: "Farcaster",
    description: "Decentralized social network protocol",
  },
  [SourceType.space_id]: {
    name: "SpaceID",
    description: "Multi-chain name service",
  },
  [SourceType.gravity]: {
    name: "Gravity Name Service",
    description: "Gravity alpha mainnet name service",
  },
  [SourceType.crossbell]: {
    name: "Crossbell",
    description: "Decentralized publishing protocol",
  },
  [SourceType.clusters]: {
    name: "Clusters",
    description: "On-chain social protocol",
  },
  [SourceType.solana]: {
    name: "Solana",
    description: "High-performance blockchain",
  },
  [SourceType.sns]: {
    name: "SNS",
    description: "Solana Name Service",
  },
  [SourceType.opensea]: {
    name: "OpenSea",
    description: "NFT marketplace",
  },
  [SourceType.twitter_hexagon]: {
    name: "Twitter Hexagon",
    description: "Twitter's NFT profile picture feature",
  },
  [SourceType.firefly]: {
    name: "Firefly",
    description: "Web3 social platform",
  },
  [SourceType.pfp]: {
    name: "PFP",
    description: "Twitter Profile Picture NFTs",
  },
  [SourceType.manually_added]: {
    name: "Manually Added",
    description: "Information added manually",
  },
  [SourceType.basenames]: {
    name: "Basenames",
    description: "The domain system on Base",
  },
  [SourceType.dentity]: {
    name: "Dentity",
    description: "Digital Credentials",
  },
  [SourceType.nftd]: {
    name: "NF.TD",
    description: "Be your own checkmark",
  },
  [SourceType.mirror]: {
    name: "Mirror",
    description: "Decentralized publishing protocol",
  },
  [SourceType.paragraph]: {
    name: "Paragraph",
    description: "Decentralized publishing protocol",
  },
  [SourceType.foundation]: {
    name: "Foundation",
    description: "NFT marketplace",
  },
  [SourceType.rarible]: {
    name: "Rarible",
    description: "NFT marketplace",
  },
  [SourceType.soundxyz]: {
    name: "Sound.xyz",
    description: "Decentralized audio platform",
  },
  [SourceType.linea]: {
    name: "Linea",
    description: "L2 based on ZK",
  },
  [SourceType.gmgn]: {
    name: "GMGN",
    description: "Web3 social platform",
  },
  [SourceType.nostr]: {
    name: "Nostr",
    description: "Web3 social platform",
  },
  [SourceType.talentprotocol]: {
    name: "Talent Protocol",
    description: "Decentralized onchain passport",
  },
  [SourceType.firefly_campaigns]: {
    name: "Firefly Campaigns",
    description: "Firefly campaigns",
  },
  [SourceType.mask_campaigns]: {
    name: "MASK Campaigns",
    description: "MASK campaigns",
  },
  [SourceType.crowdsourcing]: {
    name: "Crowdsourcing",
    description: "Crowdsourcing",
  },
} as const;

export const getSourceInfo = (sourceKey: SourceType): SourceInfo =>
  SOURCE_DATA[sourceKey] || { name: sourceKey, description: "Unknown source" };
