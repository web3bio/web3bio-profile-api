export const queryClient = async (path: string, options?: any) => {
  const baseUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "http://localhost:3000";
  console.log(baseUrl, "url");
  return await fetch(baseUrl + path, {
    headers: {
      "x-api-key": process.env.GENERAL_IDENTITY_GRAPH_API_KEY || "",
    },
    ...options,
  });
};
