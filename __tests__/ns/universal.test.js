import { expectJsonCase, findByPlatform } from "../helpers/api-assertions";

describe("Test For Universal NS API", () => {
  const cases = [
    {
      name: "sujiyan.lens keeps lens/ens address aligned",
      path: "/ns/sujiyan.lens",
      assertJson: (json) => {
        expect(findByPlatform(json, "lens")?.address).toBeTruthy();
        expect(findByPlatform(json, "ens")?.address).toBeTruthy();
      },
    },
    {
      name: "stani.lens resolves first identity",
      path: "/ns/stani.lens",
      assertJson: (json) => {
        expect(json[0].identity).toBe("stani.lens");
      },
    },
    {
      name: "gamedb.eth includes ens identity",
      path: "/profile/gamedb.eth",
      assertJson: (json) => {
        expect(findByPlatform(json, "ens").identity).toBe("gamedb.eth");
      },
    },
    {
      name: "livid.farcaster keeps farcaster identity",
      path: "/ns/livid.farcaster",
      assertJson: (json) => {
        expect(findByPlatform(json, "farcaster").identity).toBe("livid");
      },
    },
    {
      name: "luc.eth has no unstoppable .eth entry",
      path: "/ns/luc.eth",
      assertJson: (json) => {
        expect(
          json.filter(
            (x) =>
              x.identity.endsWith(".eth") &&
              x.platform === "unstoppabledomains",
          ).length,
        ).toBe(0);
      },
    },
    {
      name: "184.linea returns expected ordering prefix",
      path: "/ns/184.linea",
      assertJson: (json) => {
        expect(json.length > 0).toBeTruthy();
        expect(json[0].identity).toBe("184.linea.eth");
        expect(json[1].platform).toBe("ens");
      },
    },
    {
      name: "0xc28... includes linea profile",
      path: "/ns/0xc28de09ad1a20737b92834943558ddfcc88d020d",
      assertJson: (json) => {
        expect(json.some((x) => x.platform === "linea")).toBe(true);
      },
    },
    {
      name: "linea,184.linea includes linea profile",
      path: "/ns/linea,184.linea",
      assertJson: (json) => {
        expect(json.some((x) => x.platform === "linea")).toBe(true);
      },
    },
    {
      name: "solana address resolves to v2ex.sol",
      path: "/ns/4JBz4tAKgAmxjDPHHi9HRLj14RsCQJyuCkCFKnpz7B9s",
      assertJson: (json) => {
        expect(json[0].identity).toBe("v2ex.sol");
      },
    },
    {
      name: "0x1af... resolves farcaster first",
      path: "/ns/0x1af68a3cad9918056106d2ee77879489b56c2f80",
      assertJson: (json) => {
        expect(json[0].platform).toBe("farcaster");
      },
    },
    {
      name: "0x0caa... resolves ethereum first",
      path: "/ns/0x0caa7be0edbe2e65a4b06936782ef8fdf6de8b95",
      assertJson: (json) => {
        expect(json[0].platform).toBe("ethereum");
      },
    },
  ];

  it.each(cases)("$name", async ({ path, assertJson }) => {
    await expectJsonCase({ path, assertJson });
  });
});
