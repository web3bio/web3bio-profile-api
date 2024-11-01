import { queryClient } from "../utils/test-utils";

describe("Test For Batch Profile API", () => {
  const options = {
    method: "POST",
    body: JSON.stringify({
      ids: ["farcaster,rohitkr"],
    }),
  };
  it("It should response 200 for batch profile api", async () => {
    const res = await queryClient(
      "/profile/batch",
      options,
      "http://localhost:3000"
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    console.log(json);

    expect(json.length > 0);
  });
});
