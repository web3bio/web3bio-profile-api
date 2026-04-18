import { expectJsonCase, findByPlatform } from "../helpers/api-assertions";

describe("Test For Profile Web2 API", () => {
  const cases = [
    {
      name: "sujiyan.eth",
      path: "/profile/web2/sujiyan.eth",
      assertJson: (json) => {
        expect(json.some((x) => x.platform === "instagram")).toBe(true);
        expect(json.some((x) => x.platform === "reddit")).toBe(true);
        expect(json.some((x) => x.platform === "github")).toBe(true);
        expect(findByPlatform(json, "instagram").links.website.handle).toBe(
          "dimension.im",
        );
      },
    },
    {
      name: "accountless.eth",
      path: "/profile/web2/accountless.eth",
      assertJson: (json) => {
        expect(findByPlatform(json, "ens").links.website.handle).toBe(
          "linktr.ee/alexanderchopan",
        );
        expect(findByPlatform(json, "github").links.website.handle).toBe(
          "linktr.ee/alexanderchopan",
        );
      },
    },
  ];

  it.each(cases)("$name", async ({ path, assertJson }) => {
    await expectJsonCase({ path, assertJson });
  });
});
