import { baseURL } from "./base";

// const baseURL = 'https://api.web3.bio'

export const queryClient = async (path: string) => {
  return await fetch(baseURL + path);
};
