import { expectJsonCase } from "../helpers/api-assertions";

describe("Test For SNS NS API", () => {
  const cases = [
    {
      name: "bonfida.sns",
      path: "/ns/sns/bonfida.sns",
      assertJson: (json) => {
        expect(json.address).toBe(
          "Fw1ETanDZafof7xEULsnq9UY6o71Tpds89tNwPkWLb1v",
        );
      },
    },
    {
      name: "sujiyan.sns",
      path: "/ns/sns/sujiyan.sns",
      assertJson: (json) => {
        expect(json.address).toBe(
          "2E3k7otC558kJJsK8wV8oehXf2VxPRQA3LtyW2mvF6w5",
        );
      },
    },
    {
      name: "_tesla.sns",
      path: "/ns/sns/_tesla.sns",
      assertJson: (json) => {
        expect(json.address).toBeTruthy();
      },
    },
    {
      name: "wallet-guide-9.sns",
      path: "/ns/sns/wallet-guide-9.sns",
      assertJson: (json) => {
        expect(json.avatar).toBeTruthy();
      },
    },
    {
      name: "9mUxj781h7UXDFcbesr1YUfVGD2kQZgsUMc5kzpL9g65",
      path: "/ns/sns/9mUxj781h7UXDFcbesr1YUfVGD2kQZgsUMc5kzpL9g65",
      assertJson: (json) => {
        expect(json.platform).toBe("solana");
      },
    },
  ];

  it.each(cases)("$name", async ({ path, assertJson }) => {
    await expectJsonCase({ path, assertJson });
  });
});
