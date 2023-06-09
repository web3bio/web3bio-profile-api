import fetch from "node-fetch";

const { NEXT_PUBLIC_VERCEL_URL } = process.env;

const baseURL = NEXT_PUBLIC_VERCEL_URL
  ? `https://${NEXT_PUBLIC_VERCEL_URL}`
  : "http://localhost:3000";
// const baseURL = 'https://api.web3.bio'

export const queryClient = async (path: string) => {
  return await fetch(baseURL + path);
};
