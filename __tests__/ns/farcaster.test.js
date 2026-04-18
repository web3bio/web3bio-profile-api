import { expectJsonCase } from "../helpers/api-assertions";

describe("Test For Farcaster NS API", () => {
  const cases = [
    {
      name: "suji",
      path: "/ns/farcaster/suji",
      assertJson: (json) => {
        expect(json.identity).toBe("suji");
      },
    },
    {
      name: "0x7cbba07e31dc7b12bb69a1209c5b11a8ac50acf5",
      path: "/ns/farcaster/0x7cbba07e31dc7b12bb69a1209c5b11a8ac50acf5",
      assertJson: (json) => {
        expect(json.identity).toBe("suji");
        expect(json.address).toBeTruthy();
      },
    },
    {
      name: "dwr",
      path: "/ns/farcaster/dwr",
      assertJson: (json) => {
        expect(json.displayName).toBe("Dan Romero");
        expect(json.address).toBeTruthy();
      },
    },
    {
      name: "dwr.eth",
      path: "/ns/farcaster/dwr.eth",
      assertJson: (json) => {
        expect(json.address).toBeTruthy();
      },
    },
  ];

  it.each(cases)("$name", async ({ path, assertJson }) => {
    await expectJsonCase({ path, assertJson });
  });
});
