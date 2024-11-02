import { queryClient } from "../../utils/test-utils";

describe("Test For Batch Profile API", () => {
  const options = {
    method: "POST",
    body: JSON.stringify({
      ids: ["lens,sunshinevendetta.lens"],
    }),
  };
  it("It should response 200 for batch profile api", async () => {
    const res = await queryClient(
      "/ns/batch",
      options,
      "http://localhost:3000"
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.length > 0);
  });
});
