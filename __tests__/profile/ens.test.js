import { expectJsonCase } from "../helpers/api-assertions";

describe("Test For ENS Profile API", () => {
  const cases = [
    {
      name: "brantly.eth",
      path: "/profile/ens/brantly.eth",
      assertJson: (json) => {
        expect(json.address).toBeTruthy();
        expect(json.status).toBe(
          "building an onchain social graph for ethereum accounts",
        );
        expect(json.createdAt).toBe("2017-06-15T02:40:38.000Z");
        expect(json.links.twitter.handle).toBe("brantlymillegan");
        expect(json.links.twitter.link).toBe("https://x.com/brantlymillegan");
      },
    },
    {
      name: "dr3a.eth",
      path: "/profile/ens/dr3a.eth",
      assertJson: (json) => {
        expect(json.links.lens).toBeTruthy();
        expect(json.links.farcaster).toBeTruthy();
      },
    },
    {
      name: "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx.eth invalid resolved address",
      path: "/profile/ens/xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx.eth",
      expectedStatus: 404,
      assertJson: (json) => {
        expect(json.error).toBe("Invalid Resolved Address");
      },
    },
    {
      name: "sujiyan.eth",
      path: "/profile/ens/sujiyan.eth",
      assertJson: (json) => {
        expect(json.links.website.handle).toBe("mask.io");
        expect(json.contenthash).toBe(
          "ipns://k51qzi5uqu5di7afkyk8msyok5bxqlaudfzem68t8jilihitaz6ii523ve9tbw",
        );
        expect(json.address).toBe("0x7cbba07e31dc7b12bb69a1209c5b11a8ac50acf5");
      },
    },
    {
      name: "ricmoo.eth",
      path: "/profile/ens/ricmoo.eth",
      assertJson: (json) => {
        expect(json.links.github.handle).toBe("ricmoo");
      },
    },
    {
      name: "tartu.eth",
      path: "/profile/ens/tartu.eth",
      assertJson: (json) => {
        expect(json.address).toBe("0x161ea288055b58fb182f72b124a5d0f367b099e4");
      },
    },
    {
      name: "0xcee81f7dd39d817f699a5c9eb93e3e6520f5b996",
      path: "/profile/ens/0xcee81f7dd39d817f699a5c9eb93e3e6520f5b996",
      assertJson: (json) => {
        expect(json.identity).toBe("0xcee81f7dd39d817f699a5c9eb93e3e6520f5b996");
      },
    },
    {
      name: "0x000000000000000000000000000000000000dEaD invalid identity",
      path: "/profile/ens/0x000000000000000000000000000000000000dEaD",
      expectedStatus: 404,
      assertJson: (json) => {
        expect(json.error).toBe("Invalid Identity or Domain");
      },
    },
    {
      name: "sujiyan.lens invalid identity",
      path: "/profile/ens/sujiyan.lens",
      expectedStatus: 404,
      assertJson: (json) => {
        expect(json.error).toBe("Invalid Identity or Domain");
      },
    },
    {
      name: "gothgorl.eth",
      path: "/profile/ens/gothgorl.eth",
      assertJson: (json) => {
        expect(json.links.website.handle).toBe("linktr.ee/starcaster12");
      },
    },
    {
      name: "offchainexample.eth",
      path: "/profile/ens/offchainexample.eth",
      assertJson: (json) => {
        expect(json.address).toBe("0xffd1ac3e8818adcbe5c597ea076e8d3210b45df5");
      },
    },
    {
      name: "ethidfoundation.eth",
      path: "/profile/ens/ethidfoundation.eth",
      assertJson: (json) => {
        expect(json.address).toBe("0x6856bd704089ee2ca0e5fb680716f1501c665095");
      },
    },
  ];

  it.each(cases)("$name", async ({ path, expectedStatus, assertJson }) => {
    await expectJsonCase({ path, expectedStatus, assertJson });
  });
});
