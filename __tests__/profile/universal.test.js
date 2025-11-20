import { queryClient } from "../../utils/test-utils";

describe("Test For Universal Profile API", () => {
  it("It should response 200 data for 0x7cbba07e31dc7b12bb69a1209c5b11a8ac50acf5", async () => {
    const res = await queryClient(
      "/profile/0x7cbba07e31dc7b12bb69a1209c5b11a8ac50acf5",
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json[0].address).toBe("0x7cbba07e31dc7b12bb69a1209c5b11a8ac50acf5");
    expect(json[0].displayName).toBe("sujiyan.eth");
    expect(json[1].platform).toBe("basenames");
  });
  it("It should response 200 data for lilgho.lens", async () => {
    const res = await queryClient("/profile/lilgho.lens");
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json[0].identity).toBe("lilgho.lens");
    expect(json[0].createdAt).toBe("2023-02-10T19:45:20.000Z");
    expect(json[1].platform).toBe("lens");
    expect(json.length).toBe(11);
  });
  it("It should response 200 data for 0x7241dddec3a6af367882eaf9651b87e1c7549dff", async () => {
    const res = await queryClient(
      "/profile/0x7241dddec3a6af367882eaf9651b87e1c7549dff",
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.some((x) => x.identity === "stani.lens")).toBe(true);
  });
  it("It should response 200 data for noun124.eth", async () => {
    const res = await queryClient("/profile/noun124.eth");
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json[0].identity).toBe("noun124.eth");
  });
  it("It should response 200 data for 0x3ddfa8ec3052539b6c9549f12cea2c295cff5296", async () => {
    const res = await queryClient(
      "/profile/0x3ddfa8ec3052539b6c9549f12cea2c295cff5296",
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json[0].address).toBe("0x3ddfa8ec3052539b6c9549f12cea2c295cff5296");
    expect(json.length).toBe(1);
  });

  it("It should response 200 for sujiyan.eth", async () => {
    const res = await queryClient("/profile/sujiyan.eth");
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(
      json.find((x) => x.platform === "lens")?.address ===
        json.find((x) => x.platform === "ens")?.address,
    );
    expect(
      json.find((x) => x.platform === "farcaster").social.follower,
    ).toBeTruthy();
  });
  it("It should response 200 for mcdonalds.eth", async () => {
    const res = await queryClient("/profile/mcdonalds.eth");
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json[0].address).toBe("0x782cf6b6e735496f7e608489b0c57ee27f407e7d");
  });
  it("It should response 200 data for stani.lens", async () => {
    const res = await queryClient("/profile/stani.lens");
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json[0].identity).toBe("stani.lens");
    expect(
      json.find((x) => x.platform === "lens").social.following,
    ).toBeTruthy();
  });
  it("It should response 200 data for brantly.eth", async () => {
    const res = await queryClient("/profile/brantly.eth");
    expect(res.status).toBe(200);
    const json = await res.json();
    const linksOBJ = json.find((x) => x.platform === "ens").links;
    const links = Object.keys(linksOBJ);
    const isValidHandle = (() => {
      for (let i in linksOBJ) {
        if (linksOBJ[i]?.handle.includes("@")) return false;
        return true;
      }
    })();
    expect(isValidHandle).toBe(true);
    expect(links.length).toBe(4);
  });
  it("It should response 200 data for 0x934b510d4c9103e6a87aef13b816fb080286d649", async () => {
    const res = await queryClient(
      "/profile/0x934b510d4c9103e6a87aef13b816fb080286d649",
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json[0].platform).toBe("ethereum");
  });
  it("It should response 200 data for 0xE0b3Ef5A61324acceE3798B6D9Da5B47b0312b7c", async () => {
    const res = await queryClient(
      "/profile/0xE0b3Ef5A61324acceE3798B6D9Da5B47b0312b7c",
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.filter((x) => x.platform === "lens").length > 1);
  });

  it("It should response 200 data for 0x638b1350920333d23a7a7472c00aa5c38c278b90", async () => {
    const res = await queryClient(
      "/profile/0x638b1350920333d23a7a7472c00aa5c38c278b90",
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.find((x) => x.platform === "ens")).toBeTruthy();
  });
  it("It should response 200 data for gamedb.eth", async () => {
    const res = await queryClient("/profile/gamedb.eth");
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.find((x) => x.platform === "ens").identity).toBe("gamedb.eth");
  });
  it("It should response 200 data for livid.farcaster", async () => {
    const res = await queryClient("/profile/livid.farcaster");
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.find((x) => x.platform === "farcaster").identity).toBe("livid");
    expect(
      json.find((x) => x.platform === "farcaster").links.twitter.handle,
    ).toBe("livid");
  });
  it("It should response 200 data for griff.eth.farcaster", async () => {
    const res = await queryClient("/profile/griff.eth.farcaster");
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json[0].platform).toBe("farcaster");
  });
  it("It should response 200 data for аррӏе.eth", async () => {
    const res = await queryClient("/profile/аррӏе.eth");
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.find((x) => x.platform === "farcaster").identity).toBe("123-");
    expect(json.length > 1).toBeTruthy();
  });
  it("It should response 404 data for sujiyan.bnb", async () => {
    const res = await queryClient("/profile/sujiyan.bnb");
    expect(res.status).toBe(404);
    const json = await res.json();
    expect(json.error).toBe("Invalid Identity or Domain");
  });
  it("It should response 200 data for shoni.eth", async () => {
    const res = await queryClient("/profile/shoni.eth");
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json[0].identity).toBe("shoni.eth");
  });

  it("It should response 200 for suji_yan.twitter", async () => {
    const res = await queryClient("/profile/twitter,suji_yan");
    const json = await res.json();
    expect(json[0].platform).toBe("ens");
    expect(json[0].identity).toBe("sujiyan.eth");
  });
  it("It should response 200 for 0x027e55e1b78e873c6f7d585064b41cd2735000bacc0092fe947c11ab7742ed351f.nextid", async () => {
    const res = await queryClient(
      "/profile/0x027e55e1b78e873c6f7d585064b41cd2735000bacc0092fe947c11ab7742ed351f.nextid",
    );
    const json = await res.json();
    expect(json[0].platform).toBe("ens");
    expect(json.some((x) => x.platform === "nextid")).toBe(false);
  });
  it("It should response 200 for 8iK1d14zA54SR6bWuzAwbRTcUpMLQCHyN5zv7rWo5ZFL.nextid", async () => {
    const res = await queryClient(
      "/profile/8iK1d14zA54SR6bWuzAwbRTcUpMLQCHyN5zv7rWo5ZFL",
    );
    const json = await res.json();
    expect(json[0].address).toBe(
      "8iK1d14zA54SR6bWuzAwbRTcUpMLQCHyN5zv7rWo5ZFL",
    );
  });
  // test sort for emoji 🦊%EF%B8%8F🦊%EF%B8%8F🦊%EF%B8%8F.eth
  it("It should response 200 for %F0%9F%A6%8A%EF%B8%8F%F0%9F%A6%8A%EF%B8%8F%F0%9F%A6%8A%EF%B8%8F.eth", async () => {
    const res = await queryClient(
      "/profile/%F0%9F%A6%8A%EF%B8%8F%F0%9F%A6%8A%EF%B8%8F%F0%9F%A6%8A%EF%B8%8F.eth",
    );
    const json = await res.json();
    expect(json[0].identity).toBe("🦊🦊🦊.eth");
  });
  it("It should response 200 for filelly.eth", async () => {
    const res = await queryClient("/profile/filelly.eth");
    const json = await res.json();
    expect(json[0].address).toBe("0xea1c2886d9cb0c3b119cd145c9c1a6bc1f26f150");
  });
  it("It should response 200 for 30315.eth", async () => {
    const res = await queryClient("/profile/30315.eth");
    const json = await res.json();
    expect(json[0].identity).toBe("30315.eth");
  });
  it("It should response 200 for farcaster,0x7cbba07e31dc7b12bb69a1209c5b11a8ac50acf5", async () => {
    const res = await queryClient(
      "/profile/farcaster,0x7cbba07e31dc7b12bb69a1209c5b11a8ac50acf5",
    );
    const json = await res.json();
    expect(json[0].platform).toBe("farcaster");
    expect(json[0].identity).toBe("suji");
  });
});
