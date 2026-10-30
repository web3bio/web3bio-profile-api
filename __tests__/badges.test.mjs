import { expectJsonCase } from "./helpers/api-assertions";

describe("Test For Badges API", () => {
  const cases = [
    { platform: "farcaster", identity: "thetrickymoney.eth" },
    { platform: "farcaster", identity: "jasvinder500" },
    { platform: "farcaster", identity: "abaandon" },
    { platform: "farcaster", identity: "rvkingr" },
    { platform: "farcaster", identity: "forgetginger" },
    {
      platform: "lens",
      identity: "everyone.lens",
      expectedBadgeUrl:
        "https://explorer.lens.xyz/token/0x81A028cb73D88e54f8C148Eb08861572d09B808B/instance/18040",
    },
    { platform: "lens", identity: "thetrickymoney.lens" },
  ];

  it.each(cases)("$platform,$identity", async ({ platform, identity, expectedBadgeUrl }) => {
    await expectJsonCase({
      path: `/badges/${encodeURIComponent(`${platform},${identity}`)}`,
      assertJson: (json, res) => {
        expect(res.headers.get("x-request-platform")).toBe(platform);
        expect(Array.isArray(json)).toBe(true);
        expect(json.length).toBeGreaterThan(0);
        if (expectedBadgeUrl) {
          expect(json.some((badge) => badge.badgeUrl === expectedBadgeUrl)).toBe(true);
        }
        for (const badge of json) {
          expect(badge).toEqual({
            badgeId: expect.any(String),
            badgeName: expect.any(String),
            badgeCategory: expect.any(String),
            network: expect.any(String),
            address: expect.any(String),
            claimTxhash: expect.any(String),
            dataSource: expect.any(String),
            issuedAt: expect.any(Number),
            updatedAt: expect.any(Number),
            badgeUrl: expect.any(String),
          });
          expect(badge.badgeId).toMatch(/-\d+$/);
          const tokenId = badge.badgeId.slice(badge.badgeId.lastIndexOf("-") + 1);
          expect(badge.badgeUrl).toBe(
            `https://explorer.lens.xyz/token/0x81A028cb73D88e54f8C148Eb08861572d09B808B/instance/${tokenId}`,
          );
        }
      },
    });
  });

  const address = "0x000000000000da32185407441b46e41867606d19";
  it.each([address, `ethereum,${address}`])(
    "ETH address: %s",
    async (handle) => {
      await expectJsonCase({
        path: `/badges/${encodeURIComponent(handle)}`,
        assertJson: (json, res) => {
          expect(res.headers.get("x-request-platform")).toBe("ethereum");
          expect(Array.isArray(json)).toBe(true);
          expect(json.length).toBeGreaterThan(0);
          for (const badge of json) {
            expect(badge.network).toBe("ethereum");
            expect(badge.claimTxhash).toMatch(/^0x[0-9a-fA-F]{64}$/);
            expect(badge.badgeUrl).toBe(
              `https://etherscan.io/tx/${badge.claimTxhash}`,
            );
          }
          expect(json).toEqual(
            expect.arrayContaining([
              expect.objectContaining({
                badgeId: "defi-united",
                badgeUrl:
                  "https://etherscan.io/tx/0x4cbe5c672675a66f2904d5950c66e1993ba1a77e8e7b7eaa7d96b4d1c6409aee",
              }),
            ]),
          );
        },
      });
    },
  );
});
