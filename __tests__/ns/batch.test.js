import { expectJsonCase } from "../helpers/api-assertions";

describe("Test For Batch Query", () => {
  const getIds = [
    "ens,sujiyan.eth",
    "ens,vitalik.eth",
    "basenames,tony.base.eth",
    "farcaster,dwr.eth",
  ];

  it("It should respond 200 for Batch Query GET", async () => {
    await expectJsonCase({
      path: `/ns/batch/${encodeURIComponent(JSON.stringify(getIds))}`,
      assertJson: (json) => {
        expect(json.length).toBe(getIds.length);
      },
    });
  });
});
