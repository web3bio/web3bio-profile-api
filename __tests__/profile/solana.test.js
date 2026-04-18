import { expectJsonCase } from "../helpers/api-assertions";

describe("Test For Solana Profile API", () => {
  const cases = [
    {
      name: "sujiyan.sol",
      path: "/profile/solana/sujiyan.sol",
      assertJson: (json) => {
        expect(json.address).toBe(
          "2E3k7otC558kJJsK8wV8oehXf2VxPRQA3LtyW2mvF6w5",
        );
        expect(json.platform).toBe("sns");
      },
    },
    {
      name: "46YaTaa8Xa1xFEVDxPa4CVJpzsNADocgixS51HLNCS4Y",
      path: "/profile/solana/46YaTaa8Xa1xFEVDxPa4CVJpzsNADocgixS51HLNCS4Y",
      assertJson: (json) => {
        expect(json.address).toBe(
          "46YaTaa8Xa1xFEVDxPa4CVJpzsNADocgixS51HLNCS4Y",
        );
        expect(json.platform).toBe("sns");
      },
    },
  ];

  it.each(cases)("$name", async ({ path, assertJson }) => {
    await expectJsonCase({ path, assertJson });
  });
});
