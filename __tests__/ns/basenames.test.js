import { expectJsonCase } from "../helpers/api-assertions";

describe("Test For BaseNames NS API", () => {
  const cases = [
    {
      name: "jesse.base.eth",
      path: "/ns/basenames/jesse.base.eth",
      assertJson: (json) => {
        expect(json.address).toBe("0x2211d1d0020daea8039e46cf1367962070d77da9");
      },
    },
    {
      name: "0xce40d3c0041e7720ad2bc7a841ff05cc7923532d",
      path: "/ns/basenames/0xce40d3c0041e7720ad2bc7a841ff05cc7923532d",
      assertJson: (json) => {
        expect(json.identity).toBe("fitz.base.eth");
      },
    },
    {
      name: "drishka.base",
      path: "/ns/basenames/drishka.base",
      assertJson: (json) => {
        expect(json.address).toBe("0x9f80825a2a234cf3c7484b6042e572f707dcb05a");
      },
    },
  ];

  it.each(cases)("$name", async ({ path, assertJson }) => {
    await expectJsonCase({ path, assertJson });
  });
});
