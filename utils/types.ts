import type {
  AddressRecord,
  ErrorMessages,
  Platform,
  SocialRecord,
} from "web3bio-profile-kit/types";

export interface AuthHeaders {
  authorization?: string;
  ["x-client-ip"]?: string;
}

export interface errorHandleProps {
  identity: string | null;
  code: number;
  message: ErrorMessages | string;
  path: string;
  platform: Platform | null;
  headers?: HeadersInit;
}

export interface ProfileAPIError {
  address: string | null;
  identity: string | null;
  platform: Platform;
  error: ErrorMessages;
  message?: string;
}

export interface IdentityGraphQueryResponse {
  data: {
    identity: IdentityRecord;
  };
  errors?: string;
  msg?: string;
  code?: number;
}

export interface IdentityGraphEdge {
  source: string;
  target: string;
  dataSource: string;
  edgeType: string;
}

export interface IdentityRecord {
  id: string;
  expiredAt: number;
  registeredAt: number;
  identity: string;
  isPrimary: boolean;
  isPrimaryFarcaster?: boolean;
  network: string;
  ownerAddress: AddressRecord[];
  resolvedAddress: AddressRecord[];
  managerAddress: AddressRecord[];
  platform: Platform;
  primaryName: string | null;
  profile: ProfileRecord;
  status: string;
  updatedAt: number;
  resolver: string;
  identityGraph?: {
    vertices: IdentityRecord[];
    edges: IdentityGraphEdge[];
  };
  aliases?: string[];
}

export interface ProfileRecord {
  uid: string;
  address: string;
  avatar: string | null;
  contenthash: string;
  description: string;
  displayName: string;
  identity: string;
  network: string;
  platform: Platform;
  social: SocialRecord;
  texts: Record<string, string>;
  addresses: AddressRecord[];
  isPrimary: boolean;
  aliases?: string[];
  createdAt?: number;
}

export type CredentialCategory = "isHuman" | "isRisky" | "isSpam";

export interface CredentialRecordRaw {
  value: string;
  type: string;
  platform: Platform;
  dataSource: string;
  link: string;
  updatedAt: number;
  category?: CredentialCategory;
}

export interface CredentialRecord extends CredentialRecordRaw {
  id: string;
  credentials: CredentialRecordRaw[];
}
export interface CredentialsResponse {
  id: string;
  credentials: {
    [K in CredentialCategory]: CredentialsResponseItem | null;
  };
}

interface CredentialsResponseItem {
  value: boolean;
  sources: CredentialRecordRaw[];
}
