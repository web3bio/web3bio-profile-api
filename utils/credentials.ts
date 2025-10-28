import {
  CredentialSource,
  CredentialMetaData,
  Platform,
} from "web3bio-profile-kit/types";

export const CREDENTIALS_INFO: any = {
  // isHuman
  [CredentialSource.talent]: {
    icon: "🪪",
    platform: Platform.talent,
    label: "Talent Verified",
    description: "Proof of Personhood by Talent",
  },
  [CredentialSource.humanPassport]: {
    icon: "🪪",
    platform: Platform.humanpassport,
    label: "Humanity Verified",
    description: "Proof of Personhood by Human Passport",
  },
  [CredentialSource.binance]: {
    icon: "🪪",
    platform: Platform.binance,
    label: "KYC Verified",
    description: "Proof of KYC by Binance BABT",
  },
  [CredentialSource.coinbase]: {
    icon: "🪪",
    platform: Platform.coinbase,
    label: "KYC Verified",
    description: "Proof of KYC by Coinbase",
  },
  [CredentialSource.farcasterPro]: {
    icon: "🪪",
    platform: Platform.farcaster,
    label: "Pro Membership",
    description: "Pro Membership by Farcaster",
  },
  [CredentialSource.galxePassport]: {
    icon: "🪪",
    platform: Platform.galxe,
    label: "KYC Verified",
    description: "Proof of KYC by Galxe",
  },
  [CredentialSource.world_id]: {
    icon: "🪪",
    platform: Platform.world_id,
    label: "Humanity Verified",
    description: "Proof of Humanity by World",
  },
  [CredentialSource.zkme]: {
    icon: "🪪",
    platform: Platform.zkme,
    label: "KYC Verified",
    description: "Proof of KYC by zkMe",
  },
  [CredentialSource.humanode]: {
    icon: "🪪",
    platform: Platform.humanode,
    label: "Humanity Verified",
    description: "Proof of Humanity by Humanode",
  },
  [CredentialSource.self_xyz]: {
    icon: "🪪",
    platform: Platform.self_xyz,
    label: "Humanity Verified",
    description: "Proof of Humanity by Self.xyz",
  },
  [CredentialSource.dentity]: {
    icon: "🪪",
    platform: Platform.dentity,
    label: "Humanity Verified",
    description: "Personhood Verified by Dentity",
  },
  // isRisky
  [CredentialSource.hacked]: {
    icon: "🚨",
    label: "Compromised",
    description:
      "This account has been flagged as compromised. Avoid interactions, transactions, or sharing any sensitive information.",
  },
  [CredentialSource.hacker]: {
    icon: "🚨",
    label: "Flagged for Hacking",
    description:
      "This account is flagged as a hacker account. It is associated with suspicious or malicious activity. Avoid any interactions, transactions, or sharing of sensitive information.",
  },
  [CredentialSource.dmca]: {
    icon: "⚠️",
    label: "Copyright Violation",
    description:
      "This profile is in violation of the DMCA (Digital Millennium Copyright Act). It contains copyrighted material without proper authorization. Please refrain from interacting with or sharing any content associated with this profile.",
  },
  // isSpam
  [CredentialSource.warpcast]: {
    icon: "🤖",
    label: "Spam",
    platform: Platform.farcaster,
    description:
      "This profile may exhibit spam-like behavior. Data source: Farcaster.",
  },
};
