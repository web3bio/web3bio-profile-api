import { queryClient } from "../utils/test-utils";

describe("Test For Universal Profile API", () => {
  it("It should response 200 data for 0x028f936e528de34fc95179780751ec21256825ce604950580978a8961c5af03e50", async () => {
    const res = await queryClient(
      "/profile/0x028f936e528de34fc95179780751ec21256825ce604950580978a8961c5af03e50"
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json[0].identity).toBeTruthy();
  });
  it("It should response 200 data for 0x02731b4bd27eb1234049ecb082c4dc1f3640bb93d8d9736c898c69ad385dc66a7e", async () => {
    const res = await queryClient(
      "/profile/0x02731b4bd27eb1234049ecb082c4dc1f3640bb93d8d9736c898c69ad385dc66a7e"
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json[0].identity).toBeTruthy();
  });
  it("It should response 200 data for 0x0216e436525226b093ec753952deefd4bbc2ceb33f114b9021d1e92b12148575c6", async () => {
    const res = await queryClient(
      "/profile/0x0216e436525226b093ec753952deefd4bbc2ceb33f114b9021d1e92b12148575c6"
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json[0].identity).toBeTruthy();
  });
  it("It should response 200 for sujiyan.eth", async () => {
    const res = await queryClient("/profile/sujiyan.eth");
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(
      json.find((x) => x.platform === "lens")?.address ===
        json.find((x) => x.platform === "ENS")?.address
    );
  });
  it("It should response 404 for mcdonalds.eth", async () => {
    const res = await queryClient("/profile/mcdonalds.eth");
    expect(res.status).toBe(404);
    const json = await res.json();
    expect(json.length).toBe(0);
  });
  it("It should response 200 data for stani.lens", async () => {
    const res = await queryClient("/profile/stani.lens");
    expect(res.status).toBe(200);
    const json = await res.json();
    const json2 = await (
      await queryClient(
        `/profile/${json?.find((x) => x.platform === "lens")?.address}`
      )
    ).json();
    expect(json.length).toBe(json2.length);
  });
  it("It should response 200 data for brantly.eth", async () => {
    const res = await queryClient("/profile/brantly.eth");
    expect(res.status).toBe(200);
    const json = await res.json();
    const linksOBJ = json.find((x) => x.platform === "ENS").links;
    const links = Object.keys(linksOBJ);
    const isValidHandle = (() => {
      for (let i in linksOBJ) {
        if (linksOBJ[i]?.handle.includes("@")) return false;
        return true;
      }
    })();
    expect(links.length).toBe(6);
    expect(isValidHandle).toBe(true);
  });
  it("It should response 200 data for suji_yan", async () => {
    const res = await queryClient("/profile/suji_yan");
    expect(res.status).toBe(200);
  });
  it("It should response 200 data for 0x934b510d4c9103e6a87aef13b816fb080286d649", async () => {
    const res = await queryClient(
      "/profile/0x934b510d4c9103e6a87aef13b816fb080286d649"
    );
    expect(res.status).toBe(200);
  });
});
