export const queryClient = async (path: string) => {
  const baseUrl = "http://localhost:8787";
  // const baseUrl = process.env.BASE_URL || "http://localhost:3000";
  return await fetch(baseUrl + path, {
    headers: {
      "x-api-key":
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1lIjoiMzE0NjYzIiwiZXhwIjoyMjA1OTExNjE0LCJyb2xlIjo2fQ.hK5V1rVNJ-z5p5JlEeKMmzhLOZxGhqCyVLwQm-3iRPQ",
    },
  });
};
