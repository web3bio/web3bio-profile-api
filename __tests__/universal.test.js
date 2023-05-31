import { queryClient } from "../utils/test-utils";

const maxTimeOut = 20000;
describe("Test For Universal Profile API", () => {
  it("It should response 200 for sujiyan.eth", async () => {
    const res = await queryClient("/profile/sujiyan.eth");
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(
      json.results?.find((x) => x.platform === "twitter").address ===
        json.results?.find((x) => x.platform === "ENS").address
    );
  }, 200000);
  it("It should response empty data for mcdonalds.eth", async () => {
    const res = await queryClient("/profile/mcdonalds.eth");
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.total).toBe(0);
    expect(json.results).toBe([]);
  }, 200000);
});
