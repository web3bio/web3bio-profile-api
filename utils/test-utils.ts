export const queryClient = async (path: string, options?: any) => {
  const baseUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "http://localhost:3000";
  return await fetch(baseUrl + path, { ...options });
};
