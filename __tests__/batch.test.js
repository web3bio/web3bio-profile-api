import { queryClient } from "../utils/test-utils";

describe("Test For Batch Profile API", () => {
  const options = {
    method: "POST",
    body: JSON.stringify({
      ids: [
        "ens,sujiyan.eth",
        "ens,vitalik.eth",
        "tony.base.eth",
        "dwr.eth.farcaster",
        "lens,stani.lens",
      ],
    }),
  };
  it("It should response 200 for Batch Profile API", async () => {
    const res = await queryClient("/profile/batch", options);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.length).toBe(5);
  });
  it("It should response 200 for Batch Profile API GET", async () => {
    const ids = [
      "ens,sujiyan.eth",
      "ens,vitalik.eth",
      "tony.base.eth",
      "dwr.eth.farcaster",
      "farcaster,suji",
      "lens,stani.lens",
    ];
    const url = `/profile/batch?ids=${encodeURIComponent(ids)}`;
    const res = await queryClient(url);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.length).toBe(6);
  });
});
