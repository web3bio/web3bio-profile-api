import { queryClient } from "../utils/test-utils";

describe("Test For Profile Batch Universal Query", () => {
  const getIds = [
    "ens,0xbillys.eth",
    "lens,stani.lens",
    "tony.base",
    "dwr.eth.farcaster",
    "suji_yan.twitter",
    "twitter,billyshife888",
    "184.linea"
  ];

  it("It should response 200 for Batch Query GET", async () => {
    const url = `/profile/batch/universal/${encodeURIComponent(
      JSON.stringify(getIds)
    )}`;
    const res = await queryClient(url);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.length).toBe(getIds.length);
    expect(json[2].id).toBe("basenames,tony.base.eth");
    expect(json[3].id).toBe("farcaster,dwr.eth");
    expect(json[4].id).toBe("twitter,suji_yan");
    expect(json[5].id).toBe("twitter,billyshife888");
    expect(json[6].id).toBe("linea,184.linea.eth");
  });
});
