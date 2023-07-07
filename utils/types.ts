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
  identity: NeighbourDetail
}
