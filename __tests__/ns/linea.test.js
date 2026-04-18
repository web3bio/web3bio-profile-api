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
      name: "0xc28de09ad1a20737b92834943558ddfcc88d020d",
      path: "/ns/linea/0xc28de09ad1a20737b92834943558ddfcc88d020d",
      assertJson: (json) => {
        expect(json.identity).toBe("184.linea.eth");
      },
    },
  ];

  it.each(cases)("$name", async ({ path, assertJson }) => {
    await expectJsonCase({ path, assertJson });
  });
});
