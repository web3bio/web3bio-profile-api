import { expectJsonCase } from "../helpers/api-assertions";

describe("Test For Linea Profile API", () => {
  const cases = [
    {
      name: "184.linea.eth",
      path: "/profile/linea/184.linea",
      assertJson: (json) => {
        expect(json.address).toBe("0xc28de09ad1a20737b92834943558ddfcc88d020d");
      },
    },
    {
      name: "0xthor.linea.eth",
      path: "/profile/linea/0xthor",
      assertJson: (json) => {
        expect(json.email).toBe("thorjr88@gmail.com");
      },
    },
    {
      name: "alhemi.linea.eth",
      path: "/profile/linea/alhemi.linea.eth",
      assertJson: (json) => {
        expect(json.address).toBe("0x455c3b6b9f25e35b02037a28c3b6a6c8f1ab56c8");
      },
    },
    {
      name: "0xc28de09ad1a20737b92834943558ddfcc88d020d",
      path: "/profile/linea/0xc28de09ad1a20737b92834943558ddfcc88d020d",
      assertJson: (json) => {
        expect(json.identity).toBe("184.linea.eth");
        expect(json.links.twitter.handle).toBe("184eth");
      },
    },
    {
      name: "tacoz.linea.eth",
      path: "/profile/linea/tacoz.linea",
      assertJson: (json) => {
        expect(json.identity).toBe("tacoz.linea.eth");
      },
    },
  ];

  it.each(cases)("$name", async ({ path, assertJson }) => {
    await expectJsonCase({ path, assertJson });
  });
});
