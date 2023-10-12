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
export interface Neighbor {
  source: string[];
  identity: NeighborDetail;
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
  error?: string
  links: Record<
    PlatformType,
    {
      link: string;
      handle: string;
    }
  >;
}
