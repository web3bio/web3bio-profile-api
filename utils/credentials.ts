import {
  CredentialsType,
  CredentialsMetaData,
  Platform,
} from "web3bio-profile-kit/types";

export const CREDENTIALS_INFO: Readonly<
  Record<CredentialsType, CredentialsMetaData>
> = {
  // isHuman
  [CredentialsType.dentity]: {
    icon: "🪪",
    label: "Dentity Verification",
    description: "Personhood Verified by Dentity",
    platform: Platform.dentity,
  },
  [CredentialsType.talent]: {
    icon: "🪪",
    label: "Talent Verification",
    description: "Proof of Personhood by Talent",
    platform: Platform.talent,
  },
  [CredentialsType.human]: {
    icon: "🪪",
    label: "Human Passport Verification",
    description: "Proof of Personhood by Human Passport",
    platform: Platform.humanpassport,
  },
  // isRisky
  [CredentialsType.hacked]: {
    icon: "🚨",
    label: "Compromised",
    description:
      "This account has been flagged as compromised. Avoid interactions, transactions, or sharing any sensitive information.",
    platform: Platform.ethereum,
  },
  [CredentialsType.hacker]: {
    icon: "🚨",
    label: "Flagged for Hacking",
    description:
      "This account is flagged as a hacker account. It is associated with suspicious or malicious activity. Avoid any interactions, transactions, or sharing of sensitive information.",
    platform: Platform.ethereum,
  },
  [CredentialsType.dmca]: {
    icon: "⚠️",
    label: "Copyright Violation",
    description:
      "This profile is in violation of the DMCA (Digital Millennium Copyright Act). It contains copyrighted material without proper authorization. Please refrain from interacting with or sharing any content associated with this profile.",
    platform: Platform.farcaster,
  },
  [CredentialsType.warpcast]: {
    icon: "🤖",
    label: "Spam",
    description:
      "This profile may exhibit spam-like behavior. Data source: Farcaster.",
    platform: Platform.farcaster,
  },
};
