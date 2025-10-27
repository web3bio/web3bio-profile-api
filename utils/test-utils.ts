export const queryClient = async (path: string) => {
  const baseUrl = process.env.BASE_URL || "http://localhost:3000";
  console.log(baseUrl, "base");
  return await fetch(baseUrl + path, {
    headers: {
      "x-api-key": process.env.GENERAL_IDENTITY_GRAPH_API_KEY || "",
    },
  });
};
