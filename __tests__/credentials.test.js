import { queryClient } from "../utils/test-utils";

describe("Test For Credentials API", () => {
  it("It should response 200 for ggmonster.farcaster", async () => {
    const res = await queryClient("/credentials/ggmonster.farcaster");
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.isRisky.sources.length > 0);
  });
  it("It should response 200 for 0xb6a5426b885172fb73d3c8fcf9612610612df707", async () => {
    const res = await queryClient(
      "/credentials/0xb6a5426b885172fb73d3c8fcf9612610612df707"
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.isRisky.sources[0].value).toBe("hacker");
  });
  it("It should response 200 for jchip300.eth", async () => {
    const res = await queryClient(
      "/credentials/jchip300.eth"
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.isHuman.value).toBe(true);
  });
});
