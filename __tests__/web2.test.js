import { expectJsonCase } from "./helpers/api-assertions";

describe("Test For NS API web2 query", () => {
  const cases = [
    {
      name: "nostr,yuopu6 not found",
      path: "/ns/nostr,yuopu6",
      expectedStatus: 404,
      assertJson: () => {},
    },
    {
      name: "tedko.github",
      path: "/ns/tedko.github",
      assertJson: (json) => {
        expect(json[0].identity).toBe("sujiyan.eth");
      },
    },
    {
      name: "nicksdjohnson.twitter",
      path: "/ns/nicksdjohnson.twitter",
      assertJson: (json) => {
        expect(json[0].identity).toBe("nick.eth");
      },
    },
    {
      name: "sujiyan.discord",
      path: "/ns/sujiyan.discord",
      assertJson: (json) => {
        expect(json[0].identity).toBe("sujiyan.eth");
      },
    },
    {
      name: "wgmeets.instagram",
      path: "/ns/wgmeets.instagram",
      assertJson: (json) => {
        expect(json[0].identity).toBe("wgmeets.eth");
      },
    },
    {
      name: "jktedko.reddit",
      path: "/ns/jktedko.reddit",
      assertJson: (json) => {
        expect(json[0].identity).toBe("sujiyan.eth");
      },
    },
    {
      name: "0xhelena.bluesky",
      path: "/ns/0xhelena.bluesky",
      assertJson: (json) => {
        expect(json.some((x) => x.identity === "0xhelena.eth")).toBeTruthy();
      },
    },
    {
      name: "benzweerachat.linkedin",
      path: "/ns/benzweerachat.linkedin",
      assertJson: (json) => {
        expect(json[0].identity).toBe("cbenz.eth");
      },
    },
    {
      name: "igorls.facebook not found",
      path: "/ns/igorls.facebook",
      expectedStatus: 404,
      assertJson: () => {},
    },
  ];

  it.each(cases)("$name", async ({ path, expectedStatus, assertJson }) => {
    await expectJsonCase({ path, expectedStatus, assertJson });
  });
});
