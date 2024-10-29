import { queryClient } from "../utils/test-utils";

describe("Test For Batch Profile API", () => {
  const options = {
    method: "POST",
    body: JSON.stringify({
      ids: [
        "ethereum,0x2888Eecd915fbb6BE65dac1d51cD48a340E3Ab1f",
        "ethereum,0x2888Eecd915fbb6BE65dac1d51cD48a340E3Ab1f",
        "ethereum,0x00000000009726632680FB29d3F7A9734E3010E2",
        "ethereum,0x00000000009726632680FB29d3F7A9734E3010E2",
        "ethereum,0x00000000009726632680FB29d3F7A9734E3010E2",
        "ethereum,0x00000000009726632680FB29d3F7A9734E3010E2",
        "ethereum,0x2D08D08f066bEeF8d8e70E53daC408F365Bfc8F5",
        "ethereum,0x00000000009726632680FB29d3F7A9734E3010E2",
        "ethereum,0x00000000009726632680FB29d3F7A9734E3010E2",
        "ethereum,0x00000000009726632680FB29d3F7A9734E3010E2",
        "ethereum,0x00000000009726632680FB29d3F7A9734E3010E2",
        "farcaster,mnhsu",
        "lens,mnhsu.lens",
        "ethereum,0x8e1bD5Da87C14dd8e08F7ecc2aBf9D1d558ea174",
        "ethereum,0xd7F1Dd5D49206349CaE8b585fcB0Ce3D96f1696F",
        "ethereum,0xDdA0483184E75a5579ef9635ED14BacCf9d50283",
      ],
    }),
  };
  it("It should response 200 for batch profile api", async () => {
    const res = await queryClient(
      "/profile/batch",
      options,
      "http://localhost:3001"
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    console.log(json)

    expect(json.length > 0);
  });
});
