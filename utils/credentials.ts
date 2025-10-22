import {
  CredentialsType,
  CredentialsMetaData,
  Platform,
} from "web3bio-profile-kit/types";

export const CREDENTIALS_INFO: Readonly<
  Record<CredentialsType, CredentialsMetaData>
> = {
  // isHuman
  [CredentialsType.talent]: {
    icon: "🪪",
    platform: Platform.talent,
    label: "Talent Verified",
    description: "Proof of Personhood by Talent",
  },
  [CredentialsType.humanPassport]: {
    icon: "🪪",
    platform: Platform.humanpassport,
    label: "Humanity Verified",
    description: "Proof of Personhood by Human Passport",
  },
  [CredentialsType.binance]: {
    icon: "🪪",
    platform: Platform.binance,
    label: "KYC Verified",
    description: "Proof of KYC by Binance BABT",
  },
  [CredentialsType.coinbase]: {
    icon: "🪪",
    platform: Platform.coinbase,
    label: "KYC Verified",
    description: "Proof of KYC by Coinbase",
  },
  [CredentialsType.farcasterPro]: {
    icon: "🪪",
    platform: Platform.farcaster,
    label: "Pro Membership",
    description: "Pro Membership by Farcaster",
  },
  [CredentialsType.galxePassport]: {
    icon: "🪪",
    platform: Platform.galxe,
    label: "KYC Verified",
    description: "Proof of KYC by Galxe",
  },
  [CredentialsType.world_id]: {
    icon: "🪪",
    platform: Platform.world_id,
    label: "Humanity Verified",
    description: "Proof of Humanity by World",
  },
  [CredentialsType.zkme]: {
    icon: "🪪",
    platform: Platform.zkme,
    label: "KYC Verified",
    description: "Proof of KYC by zkMe",
  },
  [CredentialsType.humanode]: {
    icon: "🪪",
    platform: Platform.humanode,
    label: "Humanity Verified",
    description: "Proof of Humanity by Humanode",
  },
  [CredentialsType.self_xyz]: {
    icon: "🪪",
    platform: Platform.self_xyz,
    label: "Humanity Verified",
    description: "Proof of Humanity by Self.xyz",
  },
  [CredentialsType.dentity]: {
    icon: "🪪",
    platform: Platform.dentity,
    label: "Humanity Verified",
    description: "Personhood Verified by Dentity",
  },
  // isRisky
  [CredentialsType.hacked]: {
    icon: "🚨",
    label: "Compromised",
    description:
      "This account has been flagged as compromised. Avoid interactions, transactions, or sharing any sensitive information.",
  },
  [CredentialsType.hacker]: {
    icon: "🚨",
    label: "Flagged for Hacking",
    description:
      "This account is flagged as a hacker account. It is associated with suspicious or malicious activity. Avoid any interactions, transactions, or sharing of sensitive information.",
  },
  [CredentialsType.dmca]: {
    icon: "⚠️",
    label: "Copyright Violation",
    description:
      "This profile is in violation of the DMCA (Digital Millennium Copyright Act). It contains copyrighted material without proper authorization. Please refrain from interacting with or sharing any content associated with this profile.",
  },
  [CredentialsType.warpcast]: {
    icon: "🤖",
    label: "Spam",
    platform: Platform.farcaster,
    description:
      "This profile may exhibit spam-like behavior. Data source: Farcaster.",
  },
};
