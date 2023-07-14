import { PlatformType } from "./platform";

export interface ProofRecord {
  platform: string;
  identity: string;
  displayName: string;
}
export interface NeighbourDetail {
  platform: PlatformType;
  identity: string;
  uuid: string;
  displayName: string;
}
export interface Neighbor {
  source: string[];
  identity: NeighbourDetail;
}

export interface ProfileAPIResponse {
  address: string;
  addresses: Record<string, string>;
  avatar: string | null;
  description: string | null;
  platform: string;
  displayName: string | null;
  email: string | null;
  header: string | null;
  identity: string;
  location: string | null;
  links: Record<
    PlatformType,
    {
      link: string;
      handle: string;
    }
  >;
}
