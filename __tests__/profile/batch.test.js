import { queryClient } from "../../utils/test-utils";

describe("Test For Batch Query", () => {
  const getIds = [
    "ens,sujiyan.eth",
    "ens,vitalik.eth",
    "tony.base.eth",
    "suji.fcast.id",
    "lens,stani.lens",
    "linea,0xthor.linea.eth",
    "184.linea",
    "ens,аррӏе.eth",
    "farcaster,#3",
  ];

  it("It should response 200 for Batch Query GET", async () => {
    const url = `/profile/batch/${encodeURIComponent(JSON.stringify(getIds))}`;
    console.log(url, "kkk");
    const res = await queryClient(url);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.length).toBe(getIds.length);
    expect(json[0].createdAt).toBe("2020-02-07T15:25:35.000Z");
    expect(json[1].createdAt).toBe("2020-02-06T18:23:40.000Z");
    expect(json[8].identity).toBe("dwr.eth");
  });
});
