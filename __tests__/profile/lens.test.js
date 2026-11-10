import { expectJsonCase } from "../helpers/api-assertions";

describe("Test For Lens Profile API", () => {
  const cases = [
    {
      name: "sujiyan.lens",
      path: "/profile/lens/sujiyan.lens",
      assertJson: (json) => {
        expect(json.links.lens.handle).toBe("sujiyan.lens");
        expect(json.address).toBe("0x9a96f14e39fe946014ff1a11540c4d4f7b441006");
      },
    },
    {
      name: "stani.lens",
      path: "/profile/lens/stani.lens",
      assertJson: (json) => {
        expect(json.links.lens.handle).toBe("stani.lens");
        expect(json.displayName).toBe("Stani");
        expect(json.address).toBe("0x7241dddec3a6af367882eaf9651b87e1c7549dff");
      },
    },
    {
      name: "0xxxxxxxxxx invalid identity",
      path: "/profile/lens/0xxxxxxxxxx",
      expectedStatus: 404,
      assertJson: (json) => {
        expect(json.error).toBe("Invalid Identity or Domain");
      },
    },
    {
      name: "0xc0074d4F69F4281d7a8EB4D266348BA9F7599E0A not found",
      path: "/profile/lens/0xc0074d4F69F4281d7a8EB4D266348BA9F7599E0A",
      expectedStatus: 404,
      assertJson: (json) => {
        expect(json.error).toBe("Not Found");
      },
    },
    {
      name: "sujiyan.eth invalid identity",
      path: "/profile/lens/sujiyan.eth",
      expectedStatus: 404,
      assertJson: (json) => {
        expect(json.error).toBe("Invalid Identity or Domain");
      },
    },
  ];

  it.each(cases)("$name", async ({ path, expectedStatus, assertJson }) => {
    await expectJsonCase({ path, expectedStatus, assertJson });
  });
});
