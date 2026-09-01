import { CredentialSource, Platform } from "web3bio-profile-kit/types";

interface CredentialMetaData {
  platform?: Platform;
  label: string;
  description: string;
}

export const CREDENTIAL_INFO: Readonly<
  Record<CredentialSource, CredentialMetaData>
> = {
  // isHuman
  [CredentialSource.binance]: {
    platform: Platform.binance,
    label: "Binance KYC Verified",
    description: "Proof of KYC by Binance BABT",
  },
  [CredentialSource.coinbase]: {
    platform: Platform.coinbase,
    label: "Coinbase KYC Verified",
    description: "Proof of KYC by Coinbase",
  },
  [CredentialSource.dentity]: {
    platform: Platform.dentity,
    label: "Dentity Humanity Verified",
    description: "Personhood Verified by Dentity",
  },
  [CredentialSource.ethos]: {
    platform: Platform.ethos,
    label: "Ethos Humanity Verified",
    description: "Personhood Verified by Ethos",
  },
  [CredentialSource.farcasterPro]: {
    platform: Platform.farcaster,
    label: "Farcaster Pro Membership",
    description: "Pro Membership by Farcaster",
  },
  [CredentialSource.galxePassport]: {
    platform: Platform.galxe,
    label: "Galxe KYC Verified",
    description: "Proof of KYC by Galxe",
  },
  [CredentialSource.humanode]: {
    platform: Platform.humanode,
    label: "Humanode Humanity Verified",
    description: "Proof of Humanity by Humanode",
  },
  [CredentialSource.humanPassport]: {
    platform: Platform.humanpassport,
    label: "Passport Humanity Verified",
    description: "Proof of Personhood by Human Passport",
  },
  [CredentialSource.self_xyz]: {
    platform: Platform.self_xyz,
    label: "Self.xyz Humanity Verified",
    description: "Proof of Humanity by Self.xyz",
  },
  [CredentialSource.talent]: {
    platform: Platform.talent,
    label: "Talent Verified",
    description: "Proof of Personhood by Talent",
  },
  [CredentialSource.world_id]: {
    platform: Platform.world_id,
    label: "World Humanity Verified",
    description: "Proof of Humanity by World",
  },
  [CredentialSource.zkme]: {
    platform: Platform.zkme,
    label: "zkMe KYC Verified",
    description: "Proof of KYC by zkMe",
  },
  // isRisky
  [CredentialSource.dmca]: {
    label: "Copyright Violation",
    description:
      "This profile is in violation of the DMCA (Digital Millennium Copyright Act). It contains copyrighted material without proper authorization. Please refrain from interacting with or sharing any content associated with this profile.",
  },
  [CredentialSource.hacked]: {
    label: "Compromised",
    description:
      "This account has been flagged as compromised. Avoid interactions, transactions, or sharing any sensitive information.",
  },
  [CredentialSource.hacker]: {
    label: "Flagged for Hacking",
    description:
      "This account is flagged as a hacker account. It is associated with suspicious or malicious activity. Avoid any interactions, transactions, or sharing of sensitive information.",
  },
  // isSpam
  [CredentialSource.farcasterSpam]: {
    platform: Platform.farcaster,
    label: "Spam",
    description:
      "This profile may exhibit spam-like behavior. Data source: Farcaster.",
  },
};
