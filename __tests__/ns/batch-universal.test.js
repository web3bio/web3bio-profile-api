import { queryClient } from "../../utils/test-utils";

describe("Test For NS Batch Universal Query", () => {
  const getIds = [
    "ens,sujiyan.eth",
    "ens,vitalik.eth",
    "basenames,tony.base.eth",
    "farcaster,dwr.eth",
  ];

  it("It should response 200 for Batch Query GET", async () => {
    const url = `/ns/batch/universal/${encodeURIComponent(
      JSON.stringify(getIds)
    )}`;
    const res = await queryClient(url);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.length).toBe(getIds.length);
    expect(json[2].id).toBe(getIds[2]);
  });
});
