if (process.env.NODE_ENV !== "production") {
  const fs = require("fs");
  const path = require("path");

  const loadEnv = (filePath: string) => {
    try {
      const content = fs.readFileSync(filePath, "utf8");
      content.split("\n").forEach((line: string) => {
        const [key, ...values] = line.split("=");
        if (key && values.length && !process.env[key.trim()]) {
          process.env[key.trim()] = values
            .join("=")
            .trim()
            .replace(/^["']|["']$/g, "");
        }
      });
    } catch (e) {}
  };

  loadEnv(path.resolve(process.cwd(), ".env.local"));
}

export const queryClient = async (path: string) => {
  const baseUrl = process.env.BASE_URL || "http://localhost:3000";
  const API_KEY = process.env.GENERAL_IDENTITY_GRAPH_API_KEY || "";

  return await fetch(baseUrl + path, {
    headers: {
      "x-api-key": API_KEY,
    },
  });
};
