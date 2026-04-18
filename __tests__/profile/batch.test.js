import { expectJsonCase } from "../helpers/api-assertions";

describe("Test For Batch Query", () => {
  const getIds = [
    "ens,sujiyan.eth",
    "ens,vitalik.eth",
    "tony.base.eth",
    "suji.fcast.id",
    "lens,stani.lens",
    "linea,0xthor.linea.eth",
    "184.linea",
    "farcaster,#3",
    "ens,2️⃣2️⃣.eth",
  ];

  it("It should respond 200 for Batch Query GET", async () => {
    await expectJsonCase({
      path: `/profile/batch/${encodeURIComponent(JSON.stringify(getIds))}`,
      assertJson: (json) => {
        expect(json.length).toBe(getIds.length);
        expect(json[0].createdAt).toBe("2020-01-30T12:05:30.000Z");
        expect(json[1].createdAt).toBe("2017-06-18T08:39:14.000Z");
        expect(json[8].address).toBe("0x111111176b0b13ffc31d387d08726772a0492948");
      },
    });
  });
});
