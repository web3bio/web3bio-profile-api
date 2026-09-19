import { expectJsonCase } from "../helpers/api-assertions";

describe("Test For Lens NS API", () => {
  const cases = [
    {
      name: "sujiyan.lens",
      path: "/ns/lens/sujiyan.lens",
      assertJson: (json) => {
        expect(json.address).toBe("0x23b743ceda567ba4bdf437af6b83bb7fe7f51bdf");
      },
    },
    {
      name: "stani.lens",
      path: "/ns/lens/stani.lens",
      assertJson: (json) => {
        expect(json.displayName).toBe("Stani");
        expect(json.address).toBe("0xad2c0beade60fb9f7ec5c87bde8e4c126145f6e7");
      },
    },
    {
      name: "0xxxxxxxxxx invalid identity",
      path: "/ns/lens/0xxxxxxxxxx",
      expectedStatus: 404,
      assertJson: (json) => {
        expect(json.error).toBe("Invalid Identity or Domain");
      },
    },
    {
      name: "sujiyan.eth invalid identity",
      path: "/ns/lens/sujiyan.eth",
      expectedStatus: 404,
      assertJson: (json) => {
        expect(json.error).toBe("Invalid Identity or Domain");
      },
    },
    {
      name: "sujidaily.lens has avatar",
      path: "/ns/lens/sujidaily.lens",
      assertJson: (json) => {
        expect(json.avatar).toBeTruthy();
      },
    },
  ];

  it.each(cases)("$name", async ({ path, expectedStatus, assertJson }) => {
    await expectJsonCase({ path, expectedStatus, assertJson });
  });
});
