import { expectJsonCase } from "../helpers/api-assertions";

describe("Test For Solana NS API", () => {
  const cases = [
    {
      name: "bonfida.sol",
      path: "/ns/solana/bonfida.sol",
      assertJson: (json) => {
        expect(json.address).toBe(
          "Fw1ETanDZafof7xEULsnq9UY6o71Tpds89tNwPkWLb1v",
        );
        expect(json.platform).toBe("sns");
      },
    },
    {
      name: "2E3k7otC558kJJsK8wV8oehXf2VxPRQA3LtyW2mvF6w5",
      path: "/ns/solana/2E3k7otC558kJJsK8wV8oehXf2VxPRQA3LtyW2mvF6w5",
      assertJson: (json) => {
        expect(json.platform).toBe("solana");
      },
    },
  ];

  it.each(cases)("$name", async ({ path, assertJson }) => {
    await expectJsonCase({ path, assertJson });
  });
});
