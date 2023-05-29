import { queryClient } from "../utils/test-utils";

const maxTimeOut = 20000;
describe("Test For ENS Profile API", () => {
  it("It should response 404 for mcdonalds.eth", async () => {
    const res = await queryClient("/profile/ens/mcdonalds.eth");
    expect(res.status).toBe(404);
    expect((await res.json()).error).toBe("No Resolver Address");
  });
  it("It should response 404 for solperdev.eth", async () => {
    const res = await queryClient("/profile/ens/solperdev.eth");
    expect(res.status).toBe(404);
    expect((await res.json()).error).toBe("Invalid ResolvedAddress");
  });
  it(
    "It should response 200 for sujiyan.eth",
    async () => {
      const res = await queryClient("/profile/ens/sujiyan.eth");
      expect(res.status).toBe(200);
    },
    maxTimeOut
  );
  it(
    "It should response 200 for brantly.eth",
    async () => {
      const res = await queryClient("/profile/ens/brantly.eth");
      expect(res.status).toBe(200);
    },
    maxTimeOut
  );
});
