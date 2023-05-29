import { queryClient } from "../utils/test-utils";

describe("Test For Farcaster Profile API", () => {
  it("It should response 200 for suji", async () => {
    const res = await queryClient("/profile/farcaster/suji");
    expect(res.status).toBe(200);
  });
  it("It should response 200 for 0x934b510d4c9103e6a87aef13b816fb080286d649", async () => {
    const res = await queryClient(
      "/profile/farcaster/0x934b510d4c9103e6a87aef13b816fb080286d649"
    );
    expect(res.status).toBe(200);
    expect((await res.json()).identity).toBe("suji");
  });
});
