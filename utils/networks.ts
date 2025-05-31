import { NETWORK_DATA } from "web3bio-profile-kit/utils";

export const getNetworkByIdOrName = (id: number, name?: string) => {
  return Object.values(NETWORK_DATA).find((x) => {
    if (x.chainId === id) return x;
    if (name && [x.key, x.short].includes(name)) return x;
  });
};

export const getNetworkByChainId = (chainId?: number, useShort?: boolean) => {
  if (!chainId) return null;
  return (
    getNetworkByIdOrName(Number(chainId))?.[useShort ? "short" : "key"] || null
  );
};
