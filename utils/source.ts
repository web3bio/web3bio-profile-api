// sources.ts
import { SourceType } from "web3bio-profile-kit";

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
  [SourceType.nextid]: {
    name: "Next.ID",
    description: "Decentralized identity protocol",
  },
  [SourceType.rss3]: {
    name: "RSS3",
    description: "Open information syndication protocol",
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
    name: "Gravity",
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
  [SourceType.firefly]: {
    name: "Firefly",
    description: "Web3 social platform",
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
    name: "Talent",
    description: "Decentralized onchain passport",
  },
  [SourceType.firefly_campaigns]: {
    name: "Firefly",
    description: "Firefly campaigns",
  },
  [SourceType.mask_stake]: {
    name: "MASK",
    description: "MASK campaigns",
  },
  [SourceType.crowdsourcing]: {
    name: "Crowdsourcing",
    description: "Crowdsourcing",
  },
  [SourceType.particle]: {
    name: "Particle",
    description: "Particle",
  },
} as const;

export const getSourceInfo = (sourceKey: SourceType): SourceInfo =>
  SOURCE_DATA[sourceKey] || { name: sourceKey, description: "Unknown source" };
