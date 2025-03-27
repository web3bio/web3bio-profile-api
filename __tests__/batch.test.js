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
    // "ens,2️⃣2️⃣.eth",
    "ens,аррӏе.eth",
  ];

  it("It should response 200 for Batch Query GET", async () => {
    const url = `/profile/batch/${encodeURIComponent(JSON.stringify(getIds))}`;
    const res = await queryClient(url);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.length).toBe(getIds.length);
  });
});
