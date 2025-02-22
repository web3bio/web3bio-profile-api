import { queryClient } from "../utils/test-utils";

describe("Test For Profile Batch Universal Query", () => {
  const getIds = [
    "ens,0x2EC8EBB0a8eAa40e4Ce620CF9f84A96dF68D4669",
    "lens,stani.lens",
    "tony.base",
    "dwr.eth.farcaster",
    "suji_yan.twitter",
    "184.linea",
  ];

  it("It should response 200 for Batch Query GET", async () => {
    const url = `/profile/batch/universal/${encodeURIComponent(
      JSON.stringify(getIds)
    )}`;
    const res = await queryClient(url);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.length).toBe(getIds.length);
    expect(json[0].id).toBe("ens,0xbillys.eth");
    expect(json[1].id).toBe("lens,stani.lens");
    expect(json[2].id).toBe("basenames,tony.base.eth");
    expect(json[3].id).toBe("farcaster,dwr.eth");
    expect(json[4].id).toBe("twitter,suji_yan");
    expect(json[5].id).toBe("linea,184.linea.eth");
  });
});
