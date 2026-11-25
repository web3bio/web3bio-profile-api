import { expectJsonCase } from "../helpers/api-assertions";

describe("Test For BaseNames Profile API", () => {
  const cases = [
    {
      name: "suji.base",
      path: "/profile/basenames/suji.base",
      assertJson: (json) => {
        expect(json.createdAt).toBe("2024-08-22T06:32:25.000Z");
        expect(json.address).toBe("0xc9d18042baabe51d38297d1f3520cfbef0c83c32");
      },
    },
    {
      name: "tony.base.eth",
      path: "/profile/basenames/tony.base.eth",
      assertJson: (json) => {
        expect(json.links.twitter.handle).toBe("tonymfer");
      },
    },
  ];

  it.each(cases)("$name", async ({ path, assertJson }) => {
    await expectJsonCase({ path, assertJson });
  });
});
