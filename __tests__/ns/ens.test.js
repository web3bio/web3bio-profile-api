import { queryClient } from "../../utils/test-utils";

describe("Test For ENS NS API", () => {
  it("It should respond 200 for brantly.eth", async () => {
    const res = await queryClient("/ns/ens/brantly.eth");
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.address).toBeTruthy();
    expect(json).toHaveProperty("status");
    expect(json).toHaveProperty("header");
  });
  it("It should respond 404 for mcdonalds.eth", async () => {
    const res = await queryClient("/ns/ens/mcdonalds.eth");
    expect(res.status).toBe(200);
  });

  it("It should respond 200 for sujiyan.eth", async () => {
    const res = await queryClient("/ns/ens/sujiyan.eth");
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.platform).toBe("ens");
  });
  it("It should respond 200 for vitalik.eth", async () => {
    const res = await queryClient("/ns/ens/vitalik.eth");
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.platform).toBe("ens");
  });

  it("It should respond 200 for 0xhelena.eth", async () => {
    const res = await queryClient("/ns/ens/0xhelena.eth");
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.avatar).toBeTruthy();
  });
  it("It should respond 200 for 0xc0074d4f69f4281d7a8eb4d266348ba9f7599e0a", async () => {
    const res = await queryClient(
      "/ns/ens/0xc0074d4f69f4281d7a8eb4d266348ba9f7599e0a",
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.platform).toBe("ethereum");
  });
});
