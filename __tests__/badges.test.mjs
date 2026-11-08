import { Platform, ErrorMessages } from "web3bio-profile-kit/types";
import { badgeExplorerUrl, collectBadges } from "@/app/api/badge/[handle]/utils";
import { expectJsonCase } from "./helpers/api-assertions";

describe("badgeExplorerUrl", () => {
  const tx =
    "0x921b902ac5a203ed0c5220acc11846a6f02bf559ade5e1ce0e205dd805a69133";

  it("links a lens claim to that transaction", () => {
    expect(
      badgeExplorerUrl({
        network: "lens",
        claimTxhash: tx,
        address: "0x0cC8200F22f308026f71F6a9739eEDA034F0fEd4",
        badgeId: "farcaster-og-18203",
      }),
    ).toBe(`https://explorer.lens.xyz/tx/${tx}`);
  });

  it("links an ethereum claim to etherscan", () => {
    expect(badgeExplorerUrl({ network: "ethereum", claimTxhash: tx })).toBe(
      `https://etherscan.io/tx/${tx}`,
    );
  });

  it("uses the profile kit explorer for other networks", () => {
    expect(badgeExplorerUrl({ network: "polygon", claimTxhash: tx })).toBe(
      `https://polygonscan.com/tx/${tx}`,
    );
  });

  it("leaves networks without a transaction explorer and missing transactions unlinked", () => {
    expect(badgeExplorerUrl({ network: "lens", claimTxhash: null })).toBeNull();
    expect(badgeExplorerUrl({ network: "farcaster", claimTxhash: tx })).toBeNull();
  });
});

describe("collectBadges", () => {
  const address = "0x000000000000da32185407441b46e41867606d19";
  const rootBadge = {
    badgeId: "defi-united",
    network: "ethereum",
    address,
    claimTxhash: "0x4cbe5c672675a66f2904d5950c66e1993ba1a77e8e7b7eaa7d96b4d1c6409aee",
  };
  const relatedBadge = {
    badgeId: "farcaster-og",
    network: "lens",
    address,
    claimTxhash: "0x921b902ac5a203ed0c5220acc11846a6f02bf559ade5e1ce0e205dd805a69133",
  };

  it("keeps badges on the queried identity when the graph has no vertices", () => {
    expect(
      collectBadges(address, Platform.ethereum, {
        profile: { address },
        badges: [rootBadge],
        identityGraph: { vertices: [] },
      }),
    ).toEqual([rootBadge]);
  });

  it("adds badges from the same address and drops unrelated vertices", () => {
    const collected = collectBadges("vitalik.eth", Platform.ens, {
      profile: { address },
      badges: null,
      identityGraph: {
        vertices: [
          { id: `ens,vitalik.eth`, platform: "ens", badges: null },
          {
            id: `ethereum,${address}`,
            platform: "ethereum",
            badges: [rootBadge, relatedBadge],
          },
          {
            id: "ethereum,0xd8da6bf26964af9d7eed9e03e53415d37aa96045",
            platform: "ethereum",
            badges: [{ ...rootBadge, badgeId: "other-wallet" }],
          },
        ],
      },
    });

    expect(collected.map((badge) => badge.badgeId)).toEqual([
      "defi-united",
      "farcaster-og",
    ]);
  });

  it("returns null when neither the identity nor related vertices have badges", () => {
    expect(
      collectBadges("vitalik.eth", Platform.ens, {
        profile: { address },
        badges: null,
        identityGraph: { vertices: [{ id: `ethereum,${address}`, badges: null }] },
      }),
    ).toBeNull();
  });
});

describe("Test For Badge API", () => {
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
      path: `/badge/${encodeURIComponent(`${platform},${identity}`)}`,
      expectedStatus: 200,
    });
  });

  const address = "0x000000000000da32185407441b46e41867606d19";
  it.each([address, `ethereum,${address}`])(
    "ETH address: %s",
    async (handle) => {
      await expectJsonCase({
        path: `/badge/${encodeURIComponent(handle)}`,
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
