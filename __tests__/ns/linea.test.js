import { expectJsonCase } from "../helpers/api-assertions";

describe("Test For Linea NS API", () => {
  const cases = [
    {
      name: "suji.linea.eth",
      path: "/ns/linea/suji",
      assertJson: (json) => {
        expect(json.address).toBe("0x15fecfa8fa295ad7383d84d172dbe51792fa95bb");
      },
    },
    {
      name: "184.linea",
      path: "/ns/linea/184.linea",
      assertJson: (json) => {
        expect(json.address).toBe("0xc28de09ad1a20737b92834943558ddfcc88d020d");
      },
    },
  ];

  it.each(cases)("$name", async ({ path, assertJson }) => {
    await expectJsonCase({ path, assertJson });
  });
});
