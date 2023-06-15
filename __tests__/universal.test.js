import { queryClient } from "../utils/test-utils";

describe("Test For Universal Profile API", () => {
  it(
    "It should response 200 for sujiyan.eth",
    async () => {
      const res = await queryClient("/profile/sujiyan.eth");
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(
        json.results?.find((x) => x.platform === "twitter")?.address ===
          json.results?.find((x) => x.platform === "ENS")?.address
      );
    },
  );
  it(
    "It should response empty data for mcdonalds.eth",
    async () => {
      const res = await queryClient("/profile/mcdonalds.eth");
      expect(res.status).toBe(404);
      const json = await res.json();
      expect(json.total).toBe(0);
    },
  );
  it(
    "It should response 200 data for stani.lens",
    async () => {
      const res = await queryClient("/profile/stani.lens");
      expect(res.status).toBe(200);
      const json = await res.json();
      const json2 = await (
        await queryClient(
          `/profile/${json.results.find((x) => x.platform === "lens")?.address}`
        )
      ).json();
      console.log(json, json2, "response");
      expect(json.total).toBe(json2.total);
    },
  );
  it(
    "It should response 200 data for brantly.eth",
    async () => {
      const res = await queryClient("/profile/brantly.eth");
      expect(res.status).toBe(200);
      const json = await res.json();
      const linksOBJ = json.results.find((x) => x.platform === "ENS").links;
      const links = Object.keys(linksOBJ);
      const isValidHandle = (() => {
        for (let i in linksOBJ) {
          if (linksOBJ[i]?.handle.includes("@")) return false;
          return true;
        }
      })();
      expect(links.length).toBe(6);
      expect(isValidHandle).toBe(true);
    },
  );
});
