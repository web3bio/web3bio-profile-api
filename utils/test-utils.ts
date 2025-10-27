export const queryClient = async (path: string) => {
  const baseUrl = process.env.BASE_URL || "http://localhost:3000";
  const API_KEY = process.env.GENERAL_IDENTITY_GRAPH_API_KEY || "";
  return await fetch(baseUrl + path, {
    headers: {
      "x-api-key": API_KEY,
    },
  });
};
