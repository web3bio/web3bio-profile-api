import { queryClient } from "../utils/test-utils";

describe("Test For Batch Query", () => {
  const getIds = [
    "suji_yan.twitter",
    "ens,sujiyan.eth",
    "ens,vitalik.eth",
    "ens,0x2EC8EBB0a8eAa40e4Ce620CF9f84A96dF68D4669",
    "tony.base.eth",
    "dwr.eth.farcaster",
    "suji.fcast.id",
    "lens,stani.lens",
    "linea,0xthor.linea.eth",
    "184.linea",
    "farcaster,46YaTaa8Xa1xFEVDxPa4CVJpzsNADocgixS51HLNCS4Y",
    "ens,аррӏе.eth",
    "lens,#3",
    "farcaster,#3",
  ];

  it("It should response 200 for Batch Query GET", async () => {
    const url = `/profile/batch/${encodeURIComponent(JSON.stringify(getIds))}`;
    const res = await queryClient(url);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.length).toBe(getIds.length);
    expect(json[0].createdAt).toBe("2020-02-07T15:25:35.000Z");
    expect(json[5].createdAt).toBe("2023-11-07T19:42:51.000Z");
    expect(json[12].identity).toBe("aavegrants.lens");
    expect(json[13].identity).toBe("dwr.eth");
  });
});
