import { expectJsonCase, findByPlatform } from "../helpers/api-assertions";

describe("Test For Universal Profile API", () => {
  const cases = [
    {
      name: "0x7cb... profile identity",
      path: "/profile/0x7cbba07e31dc7b12bb69a1209c5b11a8ac50acf5",
      assertJson: (json) => {
        expect(json[0].address).toBe("0x7cbba07e31dc7b12bb69a1209c5b11a8ac50acf5");
        expect(json[0].displayName).toBe("sujiyan.eth");
        expect(json[1].platform).toBe("basenames");
      },
    },
    {
      name: "lilgho.lens profile entries",
      path: "/profile/lilgho.lens",
      assertJson: (json) => {
        expect(json[0].identity).toBe("lilgho.lens");
        expect(json[0].createdAt).toBe("2023-02-10T19:45:20.000Z");
        expect(json[1].platform).toBe("lens");
        expect(json.length).toBe(11);
      },
    },
    {
      name: "0x724... includes stani.lens",
      path: "/profile/0x7241dddec3a6af367882eaf9651b87e1c7549dff",
      assertJson: (json) => {
        expect(json.some((x) => x.identity === "stani.lens")).toBe(true);
      },
    },
    {
      name: "noun124.eth",
      path: "/profile/noun124.eth",
      assertJson: (json) => {
        expect(json[0].identity).toBe("noun124.eth");
      },
    },
    {
      name: "0x3dd... single result",
      path: "/profile/0x3ddfa8ec3052539b6c9549f12cea2c295cff5296",
      assertJson: (json) => {
        expect(json[0].address).toBe("0x3ddfa8ec3052539b6c9549f12cea2c295cff5296");
        expect(json.length).toBe(1);
      },
    },
    {
      name: "sujiyan.eth cross-platform coherence",
      path: "/profile/sujiyan.eth",
      assertJson: (json) => {
        expect(findByPlatform(json, "lens")?.address).toBeTruthy();
        expect(findByPlatform(json, "ens")?.address).toBeTruthy();
        expect(findByPlatform(json, "farcaster")?.social?.follower).toBeTruthy();
      },
    },
    {
      name: "mcdonalds.eth",
      path: "/profile/mcdonalds.eth",
      assertJson: (json) => {
        expect(json[0].address).toBe("0x782cf6b6e735496f7e608489b0c57ee27f407e7d");
      },
    },
    {
      name: "stani.lens social following",
      path: "/profile/stani.lens",
      assertJson: (json) => {
        expect(json[0].identity).toBe("stani.lens");
        expect(findByPlatform(json, "lens")?.social?.following).toBeTruthy();
      },
    },
    {
      name: "brantly.eth links normalization",
      path: "/profile/brantly.eth",
      assertJson: (json) => {
        const linksObj = findByPlatform(json, "ens").links;
        const hasAtPrefix = Object.values(linksObj).some((link) =>
          link?.handle?.includes("@"),
        );
        expect(hasAtPrefix).toBe(false);
        expect(Object.keys(linksObj).length).toBe(4);
      },
    },
    {
      name: "0x934... starts with lens",
      path: "/profile/0x934b510d4c9103e6a87aef13b816fb080286d649",
      assertJson: (json) => {
        expect(json[0].platform).toBe("lens");
      },
    },
    {
      name: "0xE0b... has multiple lens records",
      path: "/profile/0xE0b3Ef5A61324acceE3798B6D9Da5B47b0312b7c",
      assertJson: (json) => {
        expect(json.filter((x) => x.platform === "lens").length).toBeGreaterThan(
          1,
        );
      },
    },
    {
      name: "0x638... contains ens",
      path: "/profile/0x638b1350920333d23a7a7472c00aa5c38c278b90",
      assertJson: (json) => {
        expect(findByPlatform(json, "ens")).toBeTruthy();
      },
    },
    {
      name: "gamedb.eth ens identity",
      path: "/profile/gamedb.eth",
      assertJson: (json) => {
        expect(findByPlatform(json, "ens").identity).toBe("gamedb.eth");
      },
    },
    {
      name: "livid.farcaster profile mapping",
      path: "/profile/livid.farcaster",
      assertJson: (json) => {
        expect(findByPlatform(json, "farcaster").identity).toBe("livid");
        expect(findByPlatform(json, "farcaster").links.twitter.handle).toBe(
          "livid",
        );
      },
    },
    {
      name: "griff.eth.farcaster",
      path: "/profile/griff.eth.farcaster",
      assertJson: (json) => {
        expect(json[0].platform).toBe("farcaster");
      },
    },
    {
      name: "123- farcaster identity",
      path: "/profile/123-",
      assertJson: (json) => {
        expect(findByPlatform(json, "farcaster").identity).toBe("123-");
      },
    },
    {
      name: "sujiyan.bnb invalid identity",
      path: "/profile/sujiyan.bnb",
      expectedStatus: 404,
      assertJson: (json) => {
        expect(json.error).toBe("Invalid Identity or Domain");
      },
    },
    {
      name: "shoni.eth",
      path: "/profile/shoni.eth",
      assertJson: (json) => {
        expect(json[0].identity).toBe("shoni.eth");
      },
    },
    {
      name: "twitter,suji_yan resolves ens",
      path: "/profile/twitter,suji_yan",
      assertJson: (json) => {
        expect(json[0].platform).toBe("ens");
        expect(json[0].identity).toBe("sujiyan.eth");
      },
    },
    {
      name: "nextid hash resolves without nextid profile",
      path: "/profile/nextid,0x027e55e1b78e873c6f7d585064b41cd2735000bacc0092fe947c11ab7742ed351f",
      assertJson: (json) => {
        expect(json[0].platform).toBe("ens");
        expect(json.some((x) => x.platform === "nextid")).toBe(false);
      },
    },
    {
      name: "solana address direct resolve",
      path: "/profile/8iK1d14zA54SR6bWuzAwbRTcUpMLQCHyN5zv7rWo5ZFL",
      assertJson: (json) => {
        expect(json[0].address).toBe(
          "8iK1d14zA54SR6bWuzAwbRTcUpMLQCHyN5zv7rWo5ZFL",
        );
      },
    },
    {
      name: "emoji ens sorting profile",
      path: "/profile/%F0%9F%A6%8A%EF%B8%8F%F0%9F%A6%8A%EF%B8%8F%F0%9F%A6%8A%EF%B8%8F.eth",
      assertJson: (json) => {
        expect(json[0].identity).toBe("🦊🦊🦊.eth");
      },
    },
    {
      name: "filelly.eth address",
      path: "/profile/filelly.eth",
      assertJson: (json) => {
        expect(json[0].address).toBe("0xea1c2886d9cb0c3b119cd145c9c1a6bc1f26f150");
      },
    },
    {
      name: "30315.eth identity",
      path: "/profile/30315.eth",
      assertJson: (json) => {
        expect(json[0].identity).toBe("30315.eth");
      },
    },
    {
      name: "farcaster,address resolves suji",
      path: "/profile/farcaster,0x7cbba07e31dc7b12bb69a1209c5b11a8ac50acf5",
      assertJson: (json) => {
        expect(json[0].platform).toBe("farcaster");
        expect(json[0].identity).toBe("suji");
      },
    },
    {
      name: "krys.eth basenames farcaster handle",
      path: "/profile/krys.eth",
      assertJson: (json) => {
        const baseItem = findByPlatform(json, "basenames");
        expect(baseItem.links.farcaster.handle).toBe("krys.eth");
      },
    },
  ];

  it.each(cases)("$name", async ({ path, expectedStatus, assertJson }) => {
    await expectJsonCase({ path, expectedStatus, assertJson });
  });
});
