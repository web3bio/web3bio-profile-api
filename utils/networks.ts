import { NETWORK_DATA } from "web3bio-profile-kit";

export const networkByIdOrName = (id: number, name?: string) => {
  return Object.values(NETWORK_DATA).find((x) => {
    if (x.chainId === id) return x;
    if (name && [x.key, x.short].includes(name)) return x;
  });
};

export const chainIdToNetwork = (chainId?: number, useShort?: boolean) => {
  if (!chainId) return null;
  return (
    networkByIdOrName(Number(chainId))?.[useShort ? "short" : "key"] || null
  );
};
