// sources.ts
import { SOURCE_DATA, SourceInfo, SourceType } from "web3bio-profile-kit";

export const getSourceInfo = (sourceKey: SourceType): SourceInfo =>
  SOURCE_DATA[sourceKey] || { name: sourceKey, description: "Unknown source" };
