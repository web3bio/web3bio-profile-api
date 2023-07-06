export interface ProofRecord {
  platform: string;
  identity: string;
  displayName: string;
}
export interface Neighbor {
  source: string[];
  identity: {
    uuid: string;
    platform: string;
    identity: string;
    displayName: string;
  };
}
