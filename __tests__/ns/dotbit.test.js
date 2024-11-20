import { queryClient } from "../../utils/test-utils";

describe("Test For Dotbit NS API", () => {
  it("It should response 404 for suji.bit", async () => {
    const res = await queryClient("/ns/dotbit/suji.bit");
    expect(res.status).toBe(404);
  });
  it("It should response 404 for kingsgam.bit", async () => {
    const res = await queryClient("/ns/dotbit/kingsgam.bit");
    expect(res.status).toBe(404);
  });
});
