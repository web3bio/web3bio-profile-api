export const _fetcher = async (url: string, options?: any) => {
  const res = await fetch(url, options);
  return res.json();
};
