import { expectJsonCase } from "./helpers/api-assertions";

describe("Test For Wallet API query", () => {
  const cases = [
    {
      name: "0xcd133d337ead9c2ac799ec7524a1e0f8aa30c3b1",
      path: "/wallet/0xcd133d337ead9c2ac799ec7524a1e0f8aa30c3b1",
      assertJson: (json) => {
        expect(json.displayName).toBe("0xhelena.eth");
        expect(json.domains.length).toBeGreaterThanOrEqual(2);
      },
    },
    {
      name: "0xf4844a06d4f995c4c03195afcb5aa59dcbb5b4fc",
      path: "/wallet/0xf4844a06d4f995c4c03195afcb5aa59dcbb5b4fc",
      assertJson: (json) => {
        expect(json.domains.some((x) => x.identity === "wijuwiju.eth")).toBe(
          true,
        );
        expect(json.credential.isHuman.length).toBeGreaterThanOrEqual(1);
      },
    },
    {
      name: "suji.farcaster",
      path: "/wallet/suji.farcaster",
      assertJson: (json) => {
        expect(json.credential.isHuman).toBeTruthy();
      },
    },
    {
      name: "0xb8c2c29ee19d8307cb7255e1cd9cbde883a267d5",
      path: "/wallet/0xb8c2c29ee19d8307cb7255e1cd9cbde883a267d5",
      assertJson: (json) => {
        expect(
          json.identityGraph.some((x) => x.sources.length > 0),
        ).toBeTruthy();
      },
    },
  ];

  it.each(cases)("$name", async ({ path, assertJson }) => {
    await expectJsonCase({ path, assertJson });
  });
});
