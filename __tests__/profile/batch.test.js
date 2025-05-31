import { queryClient } from "../../utils/test-utils";

describe("Test For Batch Query", () => {
  const getIds = [
    "suji_yan.twitter",
    "ens,sujiyan.eth",
    "ens,vitalik.eth",
    "tony.base.eth",
    "dwr.eth.farcaster",
    "suji.fcast.id",
    "lens,stani.lens",
    "linea,0xthor.linea.eth",
    "184.linea",
    "farcaster,46YaTaa8Xa1xFEVDxPa4CVJpzsNADocgixS51HLNCS4Y",
    "ens,аррӏе.eth",
    "farcaster,#3",
  ];

  it("It should response 200 for Batch Query GET", async () => {
    const url = `/profile/batch/${encodeURIComponent(JSON.stringify(getIds))}`;
    const res = await queryClient(url);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.length).toBe(getIds.length);
    expect(json[0].createdAt).toBe("2020-02-07T15:25:35.000Z");
    expect(json[2].createdAt).toBe("2020-02-06T18:23:40.000Z");
    expect(json[11].identity).toBe("dwr.eth");
  });
});
