import { ErrorMessages } from "web3bio-profile-kit/types";
import { expectJsonCase } from "./helpers/api-assertions";

describe("Test For Badges API", () => {
  const cases = [
    { platform: "farcaster", identity: "thetrickymoney.eth" },
    { platform: "farcaster", identity: "jasvinder500" },
    { platform: "farcaster", identity: "abaandon" },
    { platform: "farcaster", identity: "rvkingr" },
    { platform: "farcaster", identity: "forgetginger" },
    { platform: "lens", identity: "everyone.lens" },
    { platform: "lens", identity: "thetrickymoney.lens" },
  ];

  it.each(cases)("$platform,$identity without badges", async ({ platform, identity }) => {
    await expectJsonCase({
      path: `/badges/${encodeURIComponent(`${platform},${identity}`)}`,
      expectedStatus: 404,
      assertJson: (json, res) => {
        expect(res.headers.get("x-request-platform")).toBe(platform);
        expect(res.headers.get("cache-control")).toBe("no-store");
        expect(json).toEqual({
          identity,
          platform,
          path: expect.any(String),
          error: ErrorMessages.NOT_FOUND,
        });
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
