import fetch from "node-fetch";

const { VERCEL_URL } = process.env;

const baseURL = `https://${VERCEL_URL}` || "http://localhost:3000";
// const baseURL = 'https://api.web3.bio'

export const queryClient = async (path: string) => {
  return await fetch(baseURL + path);
};
