import { queryClient } from "../utils/test-utils";

describe("Test For Farcaster Profile API", () => {
  it("It should response 200 for suji", async () => {
    const res = await queryClient("/profile/farcaster/suji");
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.addresses.eth).toBe(
      "0x934b510d4c9103e6a87aef13b816fb080286d649"
    );
    expect(json.identity).toBe("suji");
  });
  it("It should response 200 for 0x934b510d4c9103e6a87aef13b816fb080286d649", async () => {
    const res = await queryClient(
      "/profile/farcaster/0x934b510d4c9103e6a87aef13b816fb080286d649"
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.identity).toBe("suji");
    expect(json.addresses.eth).toBe(
      "0x934b510d4c9103e6a87aef13b816fb080286d649"
    );
    expect(json.links.farcaster.handle).toBe("suji");
  });
  it("It should response 200 for farcaster", async () => {
    const res = await queryClient("/profile/farcaster/farcaster");
    expect(res.status).toBe(404);
    expect((await res.json()).error).toBe('Not Found')
  });
  it("It should response 404 for 💗", async () => {
    const res = await queryClient("/profile/farcaster/💗");
    expect(res.status).toBe(404);
    const json = await res.json();
    expect(json.error).toBe("Invalid Identity or Domain");
  });
  it("It should response 200 for undefined", async () => {
    const res = await queryClient("/profile/farcaster/undefined");
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.address).toBe("0x5be51f8fe19af2543828a241e7555889a2ac9532");
  });
});
