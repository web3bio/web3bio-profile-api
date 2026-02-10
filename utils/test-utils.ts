if (process.env.NODE_ENV !== "production") {
  try {
    require("fs")
      .readFileSync(".env.local", "utf8")
      .split("\n")
      .forEach((line: string) => {
        const [key, value] = line.split("=");
        if (key && value && !process.env[key.trim()]) {
          process.env[key.trim()] = value.trim().replace(/^["']|["']$/g, "");
        }
      });
  } catch (e) {}
}

export const queryClient = async (path: string) => {
  const baseUrl = process.env.BASE_URL || "http://localhost:3000";
  const API_KEY = process.env.GENERAL_IDENTITY_GRAPH_API_KEY || "";

  return fetch(baseUrl + path, {
    headers: { "x-api-key": API_KEY },
  });
};
