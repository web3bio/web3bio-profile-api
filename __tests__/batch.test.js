import { queryClient } from "../utils/test-utils";

describe("Test For Batch Profile API", () => {
  const options = {
    method: "POST",
    body: JSON.stringify({
      ids: [
        "ethereum,0x5d25e3ebb10f4debf1d7b76eb94302d2d74c7035",
        "ethereum,0x6b0bda3f2ffed5efc83fa8c024acff1dd45793f1",
        "ethereum,0xadd746be46ff36f10c81d6e3ba282537f4c68077",
        "ethereum,0x0c7d81aeee69ce8b70159269cfce60588e2d5eac",
      ],
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
    expect(json.length > 0);
  });
});
