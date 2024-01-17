import { queryClient } from "../../utils/test-utils";

describe("Test For Universal NS API", () => {
  it("It should response 200 data for 0x028f936e528de34fc95179780751ec21256825ce604950580978a8961c5af03e50", async () => {
    const res = await queryClient(
      "/ns/0x028f936e528de34fc95179780751ec21256825ce604950580978a8961c5af03e50"
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json[0].identity).toBeTruthy();
  });

  it("It should response 200 for sujiyan.eth", async () => {
    const res = await queryClient("/ns/sujiyan.eth");
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(
      json.find((x) => x.platform === "lens")?.address ===
        json.find((x) => x.platform === "ENS")?.address
    );
  });

  it("It should response 200 data for stani.lens", async () => {
    const res = await queryClient("/ns/stani.lens");
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json[0].identity).toBe('stani.lens');
  });

  it("It should response 200 data for jeffx.bit", async () => {
    const res = await queryClient("/ns/jeffx.bit");
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.length > 1);
  });

  it("It should response 200 data for gamedb.eth", async () => {
    const res = await queryClient("/profile/gamedb.eth");
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.find((x) => x.platform === "ENS").identity).toBe("gamedb.eth");
  });
  it("It should response 200 data for livid.farcaster", async () => {
    const res = await queryClient("/ns/livid.farcaster");
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.find((x) => x.platform === "farcaster").identity).toBe("livid");
  });
});
