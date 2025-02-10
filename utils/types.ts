import { PlatformType } from "./platform";
import { SourceType } from "./source";

export interface AuthHeaders {
  authorization?: string;
}

export interface ParamsType {
  params: {
    handle: string;
  };
}

export type Links = Record<PlatformType, LinksItem>;

export type LinksItem = {
  link: string | null;
  handle: string | null;
  sources: SourceType[];
};

export interface errorHandleProps {
  identity: string | null;
  code: number;
  message: ErrorMessages | string;
  platform: PlatformType | string;
  headers?: HeadersInit;
}

export enum ErrorMessages {
  notFound = "Not Found",
  invalidResolver = "Invalid Resolver Address",
  invalidResolved = "Invalid Resolved Address",
  notExist = "Does Not Exist",
  invalidIdentity = "Invalid Identity or Domain",
  invalidAddr = "Invalid Address",
  unknownError = "Unknown Error Occurs",
  networkError = "Network Error",
}

export interface ProfileNSResponse {
  identity: string;
  address: string;
  avatar: string | null;
  description: string | null;
  platform: string;
  displayName: string | null;
}
export interface ProfileAPIResponse extends ProfileNSResponse {
  email: string | null;
  contenthash: string | null;
  header: string | null;
  location: string | null;
  error?: string;
  links: Links | {};
  social: SocialRecord | {};
}

interface SocialRecord {
  uid: number;
  follower: number;
  following: number;
}
interface AddressRecord {
  address: string;
  network: string;
  __typename: "Address";
}
export interface IdentityGraphQueryResponse {
  data: {
    identity: IdentityRecord;
  };
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
  identity: string;
  isPrimary: boolean;
  network: string;
  ownerAddress: AddressRecord[];
  resolvedAddress: AddressRecord[];
  platform: PlatformType;
  primaryName: string | null;
  profile: ProfileRecord;
  identityGraph: {
    vertices: IdentityRecord[];
    edges: IdentityGraphEdge[];
  };
}

export interface ProfileRecord {
  // from web3bio IdentityGraph Service
  uid: string;
  address: string;
  avatar: string;
  contenthash: string;
  description: string;
  displayName: string;
  identity: string;
  network: string;
  platform: PlatformType;
  social: SocialRecord;
  texts: { [index: string]: string };
  addresses: AddressRecord[];
  aliases?: string[];
}

export const enum LensParamType {
  domain = "domain",
  address = "address",
}
