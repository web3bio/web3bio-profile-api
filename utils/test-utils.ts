export const queryClient = async (path: string, options?: any) => {
  const baseUrl = process.env.BASE_URL
    ? `https://${process.env.BASE_URL}`
    : "http://localhost:3000";
  return await fetch(baseUrl + path, { ...options });
};
