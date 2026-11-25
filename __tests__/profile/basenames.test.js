import { expectJsonCase } from "../helpers/api-assertions";

describe("Test For BaseNames Profile API", () => {
  const cases = [
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
