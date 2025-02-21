import { queryClient } from "../utils/test-utils";

describe("Test For Batch Query", () => {
  // const postIds = [
  //   "ens,sujiyan.eth",
  //   "tony.base.eth",
  //   "dwr.eth.farcaster",
  //   "farcaster,suji",
  //   "lens,stani.lens",
  // ];

  const getIds = [
    "ens,sujiyan.eth",
    "ens,0x2EC8EBB0a8eAa40e4Ce620CF9f84A96dF68D4669",
    "tony.base.eth",
    "dwr.eth.farcaster",
    "suji.fcast.id",
    "lens,stani.lens",
    "linea,0xthor.linea.eth",
    "184.linea",
    "suji_yan.twitter",
  ];

  // it("It should response 200 for Batch Query POST", async () => {
  //   const options = {
  //     method: "POST",
  //     body: JSON.stringify({ ids: postIds }),
  //   };
  //   const res = await queryClient("/profile/batch", options);
  //   expect(res.status).toBe(200);
  //   const json = await res.json();
  //   expect(json.length).toBe(postIds.length);
  // });

  it("It should response 200 for Batch Query GET", async () => {
    const url = `/profile/batch/${encodeURIComponent(JSON.stringify(getIds))}`;
    const res = await queryClient(url);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.length).toBe(getIds.length);
  });
});
