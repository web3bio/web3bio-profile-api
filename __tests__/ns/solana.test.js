import { queryClient } from "../../utils/test-utils";

describe("Test For Solana NS API", () => {
  it("It should response 200 for bonfida.sol", async () => {
    const res = await queryClient("/ns/solana/bonfida.sol");
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.avatar).toBeTruthy();
  });
  it("It should response 200 for sujiyan.sol", async () => {
    const res = await queryClient("/ns/solana/sujiyan.sol");
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.address).toBe("2E3k7otC558kJJsK8wV8oehXf2VxPRQA3LtyW2mvF6w5");
  });
});
