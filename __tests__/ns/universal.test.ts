import { GET } from "@/app/api/ns/[handle]/route";
import { generateRequestBody } from "@/utils/test-utils";

describe("Test For Universal NS API", () => {
  it("It should response 200 data for 0x028f936e528de34fc95179780751ec21256825ce604950580978a8961c5af03e50", async () => {
    const res = await GET(
      generateRequestBody(
        "0x028f936e528de34fc95179780751ec21256825ce604950580978a8961c5af03e50"
      )
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json[0].identity).toBeTruthy();
  });

  it("It should response 200 for sujiyan.lens", async () => {
    const res = await GET(generateRequestBody("sujiyan.lens"));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(
      json.find((x: { platform: string }) => x.platform === "lens")?.address ===
        json.find((x: { platform: string }) => x.platform === "ens")?.address
    );
  });

  it("It should response 200 data for stani.lens", async () => {
    const res = await GET(generateRequestBody("stani.lens"));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json[0].identity).toBe("stani.lens");
  });

  it("It should response 200 data for jeffx.bit", async () => {
    const res = await GET(generateRequestBody("jeffx.bit"));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.length > 1);
  });

  it("It should response 200 data for gamedb.eth", async () => {
    const res = await GET(generateRequestBody("gamedb.eth"));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(
      json.find((x: { platform: string }) => x.platform === "ens").identity
    ).toBe("gamedb.eth");
  });
  it("It should response 200 data for livid.farcaster", async () => {
    const res = await GET(generateRequestBody("livid.farcaster"));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(
      json.find((x: { platform: string }) => x.platform === "farcaster")
        .identity
    ).toBe("livid");
  });
  it("It should response 200 data for freeguy.eth", async () => {
    const res = await GET(generateRequestBody("freeguy.eth"));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(
      json.find((x: { platform: string }) => x.platform === "ens").address
    ).toBe("0x18dbd0bfd810ac8cf6d1eee77fc3905db4c1bf48");
  });
});
