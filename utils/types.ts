import { PlatformType } from "./platform";

export interface ProofRecord {
  platform: string;
  identity: string;
  displayName: string;
}
export interface NeighborDetail {
  platform: PlatformType;
  identity: string;
  uuid: string;
  displayName: string;
}

export interface ProfileAPIResponse {
  address: string;
  avatar: string | null;
  description: string | null;
  platform: string;
  displayName: string | null;
  email: string | null;
  header: string | null;
  identity: string;
  location: string | null;
  error?: string;
  links: Record<
    PlatformType,
    {
      link: string;
      handle: string;
    }
  >;
}

export interface RelationServiceQueryResponse {
  data: {
    identity: {
      identity: string;
      platform: PlatformType;
      displayName: string;
      reverse: boolean;
      uid: string;
      uuid: string;
      expiredAt: string;
      identityGraph: {
        vertices: IdentityRecord[];
      };
    };
  };
}

export interface IdentityRecord {
  uuid: string;
  identity: string;
  platform: PlatformType;
  displayName: string;
  reverse: boolean;
  expiredAt: string;
}
