import { expectJsonCase } from "../helpers/api-assertions";

describe("Test For Lens NS API", () => {
  const cases = [
    {
      name: "sujiyan.lens",
      path: "/ns/lens/sujiyan.lens",
      assertJson: (json) => {
        expect(json.address).toBe("0x9a96f14e39fe946014ff1a11540c4d4f7b441006");
      },
    },
    {
      name: "stani.lens",
      path: "/ns/lens/stani.lens",
      assertJson: (json) => {
        expect(json.displayName).toBe("Stani");
        expect(json.address).toBe("0x7241dddec3a6af367882eaf9651b87e1c7549dff");
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
