import { queryClient } from "../utils/test-utils";

describe("Test For Batch Query", () => {
  const postIds = [
    "ens,sujiyan.eth",
    "tony.base.eth",
    "dwr.eth.farcaster",
    "farcaster,suji",
    "lens,stani.lens",
  ];

  const getIds = [
    "ens,sujiyan.eth",
    "ens,vitalik.eth",
    "tony.base.eth",
    "dwr.eth.farcaster",
    "farcaster,suji",
    "lens,stani.lens",
  ];

  it("It should response 200 for Batch Query POST", async () => {
    const options = {
      method: "POST",
      body: JSON.stringify({ ids: postIds }),
    };
    const res = await queryClient("/profile/batch", options);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.length).toBe(postIds.length);
  });

  it("It should response 200 for Batch Query GET", async () => {
    const url = `/profile/batch?ids=${encodeURIComponent(JSON.stringify(getIds))}`;
    const res = await queryClient(url);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.length).toBe(getIds.length);
  });
});
