import { expectJsonCase } from "../helpers/api-assertions";

describe("Test For ENS NS API", () => {
  const cases = [
    {
      name: "brantly.eth",
      path: "/ns/ens/brantly.eth",
      assertJson: (json) => {
        expect(json.address).toBeTruthy();
        expect(json).toHaveProperty("status");
        expect(json).toHaveProperty("header");
      },
    },
    {
      name: "mcdonalds.eth",
      path: "/ns/ens/mcdonalds.eth",
      assertJson: () => {},
    },
    {
      name: "sujiyan.eth",
      path: "/ns/ens/sujiyan.eth",
      assertJson: (json) => {
        expect(json.platform).toBe("ens");
      },
    },
    {
      name: "vitalik.eth",
      path: "/ns/ens/vitalik.eth",
      assertJson: (json) => {
        expect(json.platform).toBe("ens");
      },
    },
    {
      name: "0xhelena.eth",
      path: "/ns/ens/0xhelena.eth",
      assertJson: (json) => {
        expect(json.avatar).toBeTruthy();
      },
    },
    {
      name: "0xc0074d4f69f4281d7a8eb4d266348ba9f7599e0a",
      path: "/ns/ens/0xc0074d4f69f4281d7a8eb4d266348ba9f7599e0a",
      assertJson: (json) => {
        expect(json.platform).toBe("ethereum");
      },
    },
  ];

  it.each(cases)("$name", async ({ path, assertJson }) => {
    await expectJsonCase({ path, assertJson });
  });
});
