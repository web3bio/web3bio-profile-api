import { queryClient } from "../../utils/test-utils";

describe("Test For Farcaster NS API", () => {
  it("It should response 200 for suji", async () => {
    const res = await queryClient("/ns/farcaster/suji");
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.identity).toBe("suji");
  });
  it("It should response 200 for 0x7cbba07e31dc7b12bb69a1209c5b11a8ac50acf5", async () => {
    const res = await queryClient(
      "/ns/farcaster/0x7cbba07e31dc7b12bb69a1209c5b11a8ac50acf5",
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.identity).toBe("suji");
    expect(json.address).toBeTruthy();
  });

  it("It should response 404 for dwr", async () => {
    const res = await queryClient("/ns/farcaster/dwr");
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.displayName).toBe("Dan Romero");
    expect(json.address).toBeTruthy();
  });
  it("It should response 200 for dwr.eth", async () => {
    const res = await queryClient("/ns/farcaster/dwr.eth");
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.address).toBeTruthy();
  });
});
