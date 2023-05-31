import { queryClient } from "../utils/test-utils";

describe("Test For Lens Profile API", () => {
  it("It should response 200 for sujiyan.lens", async () => {
    const res = await queryClient("/profile/lens/sujiyan.lens");
    expect(res.status).toBe(200);
  });
  it("It should response 200 for stani.lens", async () => {
    const res = await queryClient("/profile/lens/stani.lens");
    expect(res.status).toBe(200);
  });
  it("It should response 200 for 0x934b510d4c9103e6a87aef13b816fb080286d649", async () => {
    const res = await queryClient(
      "/profile/lens/0x934b510d4c9103e6a87aef13b816fb080286d649"
    );
    expect(res.status).toBe(200);
    expect((await res.json()).identity).toBe("sujiyan.lens");
  });
  it("It should response 404 for 0xxxxxxxxxx", async () => {
    const res = await queryClient("/profile/lens/0xxxxxxxxxx");
    expect(res.status).toBe(404);
  });
  it("It should response 404 for 0xc0074d4F69F4281d7a8EB4D266348BA9F7599E0A", async () => {
    const res = await queryClient(
      "/profile/lens/0xc0074d4F69F4281d7a8EB4D266348BA9F7599E0A"
    );
    expect(res.status).toBe(404);
  });
});
