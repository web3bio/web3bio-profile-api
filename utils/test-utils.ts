import { BASE_URL } from "./base";

// const baseURL = 'https://api.web3.bio'

export const queryClient = async (path: string, options?: any) => {
  return await fetch(BASE_URL + path, { ...options });
};
