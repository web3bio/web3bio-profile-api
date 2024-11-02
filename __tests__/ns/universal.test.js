import { queryClient } from "../../utils/test-utils";

describe("Test For Universal NS API", () => {
  it("It should response 200 for sujiyan.lens", async () => {
    const res = await queryClient("/ns/sujiyan.lens");
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(
      json.find((x) => x.platform === "lens")?.address ===
        json.find((x) => x.platform === "ens")?.address
    );
  });

  it("It should response 200 data for stani.lens", async () => {
    const res = await queryClient("/ns/stani.lens");
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json[0].identity).toBe("stani.lens");
  });

  it("It should response 404 data for jeffx.bit", async () => {
    const res = await queryClient("/ns/jeffx.bit");
    expect(res.status).toBe(404);
  });

  it("It should response 200 data for gamedb.eth", async () => {
    const res = await queryClient("/profile/gamedb.eth");
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.find((x) => x.platform === "ens").identity).toBe("gamedb.eth");
  });
  it("It should response 200 data for livid.farcaster", async () => {
    const res = await queryClient("/ns/livid.farcaster");
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.find((x) => x.platform === "farcaster").identity).toBe("livid");
  });
  it("It should response 200 data for freeguy.eth", async () => {
    const res = await queryClient("/ns/freeguy.eth");
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.find((x) => x.platform === "ens").address).toBe(
      "0x18dbd0bfd810ac8cf6d1eee77fc3905db4c1bf48"
    );
  });
  it("It should response 200 data for luc.eth", async () => {
    const res = await queryClient("/ns/luc.eth");
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(
      json.filter(
        (x) =>
          x.identity.endsWith(".eth") && x.platform === "unstoppabledomains"
      ).length
    ).toBe(0);
  });
});
