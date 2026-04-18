import { expectJsonCase, requestJson } from "../helpers/api-assertions";

describe("Test For Ethereum Profile API", () => {
  const cases = [
    {
      name: "luc.eth",
      path: "/ns/ethereum/luc.eth",
      assertJson: (json) => {
        expect(json.identity).toBeTruthy();
      },
    },
    {
      name: "planetable.eth",
      path: "/ns/ethereum/planetable.eth",
      assertJson: (json) => {
        expect(json.address).toBe("0x18deee9699526f8c8a87004b2e4e55029fb26b9a");
        expect(json.platform).toBe("ens");
      },
    },
  ];

  it.each(cases)("$name", async ({ path, assertJson }) => {
    await expectJsonCase({ path, assertJson });
  });

  it("0x7241... keeps ns/ethereum and ns/ens displayName aligned", async () => {
    const { json } = await requestJson(
      "/ns/ethereum/0x7241DDDec3A6aF367882eAF9651b87E1C7549Dff",
    );
    const { json: ensJson } = await requestJson(
      "/ns/ens/0x7241DDDec3A6aF367882eAF9651b87E1C7549Dff",
    );
    expect(json.displayName).toBe(ensJson.displayName);
  });
});
