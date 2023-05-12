export const SIMPLE_HASH_URL = "https://simplehash-proxy.r2d2.to";
export const _fetcher = async (url: string, options?: any) => {
  const res = await fetch(url, options);
  return res.json();
};