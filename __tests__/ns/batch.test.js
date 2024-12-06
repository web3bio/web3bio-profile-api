import { queryClient } from "../../utils/test-utils";

describe("Test For Batch Query", () => {
  // const postIds = [
  //   "ens,sujiyan.eth",
  //   "ens,vitalik.eth",
  //   "tony.base.eth",
  //   "farcaster,dwr.eth",
  //   "lens,stani.lens",
  // ];

  const getIds = [
    "ens,sujiyan.eth",
    "ens,vitalik.eth",
    "basenames,tony.base.eth",
    "farcaster,dwr.eth",
  ];

  // it("It should response 200 for Batch Query POST", async () => {
  //   const options = {
  //     method: "POST",
  //     body: JSON.stringify({ ids: postIds }),
  //   };
  //   const res = await queryClient("/ns/batch", options);
  //   expect(res.status).toBe(200);
  //   const json = await res.json();
  //   expect(json.length).toBe(postIds.length);
  // });

  it("It should response 200 for Batch Query GET", async () => {
    const url = `/ns/batch/${encodeURIComponent(JSON.stringify(getIds))}`;
    const res = await queryClient(url);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.length).toBe(getIds.length);
  });
});
