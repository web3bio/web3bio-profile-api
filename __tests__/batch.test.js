import { queryClient } from "../utils/test-utils";

describe("Test For Batch Profile API", () => {
  const options = {
    method: "POST",
    body: JSON.stringify({
      ids: [
        "ens,sujiyan.eth",
        "farcaster,#3",
        "farcaster,dwr",
        "farcaster,#966",
        "farcaster,#1111111",
        "farcaster,0xd8da6bf26964af9d7eed9e03e53415d37aa96045",
        "lens,#11874",
        "lens,sujidaily.lens",
        "lens,#966",
        "lens,0xd8da6bf26964af9d7eed9e03e53415d37aa96045",
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
