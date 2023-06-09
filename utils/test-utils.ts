import fetch from "node-fetch";

const baseURL = "http://localhost:3000/api" || process.env.VERCEL_URL;
// const baseURL = 'https://api.web3.bio'

export const queryClient = async (path: string) => {
  return await fetch(baseURL + path);
};
