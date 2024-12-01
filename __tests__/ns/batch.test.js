import { queryClient } from "../../utils/test-utils";

describe("Test For Batch Query", () => {
  const options = {
    method: "POST",
    body: JSON.stringify({
      ids: [
        "ens,sujiyan.eth",
        "ens,vitalik.eth",
        "tony.base.eth",
        "farcaster,dwr.eth",
        "lens,stani.lens",
      ],
    }),
  };
  it("It should response 200 for Batch Query POST", async () => {
    const res = await queryClient("/ns/batch", options);
    expect(res.status).toBe(200);
    const json = await res.json();
    // console.log(json);
    expect(json.length).toBe(5);
  });
  it("It should response 200 for Batch Query GET", async () => {
    const ids = [
      "ens,sujiyan.eth",
      "ens,vitalik.eth",
      "basenames,tony.base.eth",
      "farcaster,dwr.eth",
    ];
    const url = `/ns/batch?ids=${encodeURIComponent(JSON.stringify(ids))}`;
    const res = await queryClient(url);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.length).toBe(4);
  });
});
