import { expectJsonCase } from "../helpers/api-assertions";

describe("Test For Farcaster Profile API", () => {
  const cases = [
    {
      name: "suji",
      path: "/profile/farcaster/suji",
      assertJson: (json) => {
        expect(json.identity).toBe("suji");
        expect(json.links.twitter.handle).toBe("suji_yan");
        expect(json.links.twitter.sources.includes("farcaster")).toBeTruthy();
      },
    },
    {
      name: "0xc648dbbe0a20f850ff5ef2aa73ffb5a149befca2",
      path: "/profile/farcaster/0xc648dbbe0a20f850ff5ef2aa73ffb5a149befca2",
      assertJson: (json) => {
        expect(json.identity).toBe("suji");
        expect(json.address).toBeTruthy();
        expect(json.links.farcaster.handle).toBe("suji");
        expect(json.createdAt).toBe("2023-11-07T22:14:15.000Z");
      },
    },
    {
      name: "farcaster",
      path: "/profile/farcaster/farcaster",
      assertJson: (json) => {
        expect(json.displayName).toBe("Farcaster");
      },
    },
    {
      name: "heart emoji invalid identity",
      path: "/profile/farcaster/💗",
      expectedStatus: 404,
      assertJson: (json) => {
        expect(json.error).toBe("Invalid Identity or Domain");
      },
    },
    {
      name: "july",
      path: "/profile/farcaster/july",
      assertJson: (json) => {
        expect(json.address).toBe("0xb2c42d93c1ec6c57b1713e03827369d59866e4b4");
      },
    },
    {
      name: "dwr",
      path: "/profile/farcaster/dwr",
      assertJson: (json) => {
        expect(json.displayName).toBe("Dan Romero");
      },
    },
    {
      name: "dwr.eth",
      path: "/profile/farcaster/dwr.eth",
      assertJson: (json) => {
        expect(json.address).toBe("0x6ce09ed5526de4afe4a981ad86d17b2f5c92fea5");
      },
    },
    {
      name: "farcaster%2C%233",
      path: "/profile/farcaster/farcaster%2C%233",
      assertJson: (json) => {
        expect(json.identity).toBe("dwr");
      },
    },
  ];

  it.each(cases)("$name", async ({ path, expectedStatus, assertJson }) => {
    await expectJsonCase({ path, expectedStatus, assertJson });
  });
});
