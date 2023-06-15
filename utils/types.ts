export interface ProofRecord{
    platform: string,
    identity: string,
    displayName: string
}
export interface NeighborWithTraversal{
    source: string,
    from:ProofRecord,
    to:ProofRecord
}