import { queryClient } from "../utils/test-utils";

describe("Test For NS API web2 query", () => {
  it("It should response 200 for 0xcd133d337ead9c2ac799ec7524a1e0f8aa30c3b1", async () => {
    const res = await queryClient(
      "/wallet/0xcd133d337ead9c2ac799ec7524a1e0f8aa30c3b1",
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.displayName).toBe("0xhelena.eth");
    expect(json.domains.length).toBeGreaterThanOrEqual(6);
  });
  it("It should response 200 for 0xf4844a06d4f995c4c03195afcb5aa59dcbb5b4fc", async () => {
    const res = await queryClient(
      "/wallet/0xf4844a06d4f995c4c03195afcb5aa59dcbb5b4fc",
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.domains[0].identity).toBe("wijuwiju.eth");
    expect(json.credential.isHuman.length).toBeGreaterThanOrEqual(1);
  });
  it("It should response 200 for suji.farcaster", async () => {
    const res = await queryClient("/wallet/suji.farcaster");
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.credential.isHuman).toBeTruthy();
  });
});
