import { queryClient } from "../utils/test-utils";

describe("Test For Batch Profile API", () => {
  const options = {
    method: "POST",
    body: JSON.stringify({
      ids: [
        "ethereum,0x0d3f5a7a1ee78e743e25c18e66942fcbcd84ccad",
        "ethereum,0x2332a02fea96b42fc3095ae7c73963980db9331b",
        "ethereum,0x111111176b0b13ffc31d387d08726772a0492948",
        "ethereum,0x8eddf5431f5b31933bfbd8111d54fc6e9456e6c1",
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
    console.log(json)
    expect(json.length > 0);
  });
});
