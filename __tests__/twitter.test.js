import { queryClient } from "../utils/test-utils";

const maxTimeOut = 10000;

describe("Test For Twitter Profile API", () => {
  it("It should response 200 for suji_yan", async () => {
    const res = await queryClient("/profile/twitter/suji_yan");
    expect(res.status).toBe(200);
    expect((await res.json()).identity).toBe("suji_yan");
  });
  it(
    "It should response 200 for sujiyan",
    async () => {
      const res = await queryClient("/profile/twitter/sujiyan");
      expect(res.status).toBe(200);
      expect((await res.json()).displayName).toBe("かめ");
    },
    maxTimeOut
  );
  it("It should response 404 for null", async () => {
    const res = await queryClient("/profile/twitter/null");
    expect(res.status).toBe(404);
    expect((await res.json()).error).toBe("Not Found");
  });
  it("It should response 404 for undefined", async () => {
    const res = await queryClient("/profile/twitter/null");
    expect(res.status).toBe(404);
    expect((await res.json()).error).toBe("Not Found");
  });
});
