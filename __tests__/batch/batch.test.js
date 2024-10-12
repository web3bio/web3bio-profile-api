import { queryClient } from "../../utils/test-utils";

describe("Test For Batch Profile API", () => {
  const options = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      ids: [
        "ethereum,0x934b510d4c9103e6a87aef13b816fb080286d649",
        "ethereum,0x2EC8EBB0a8eAa40e4Ce620CF9f84A96dF68D4669",
      ],
    }),
  };
  it("It should response 200 for batch profile api", async () => {
    const res = await queryClient("/profile/batch", options,'http://localhost:3000');
    const json = await res.json()
    console.log(json,'json')
    expect(res.status).toBe(200);
  });
});
