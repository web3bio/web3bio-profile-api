import { queryClient } from "../utils/test-utils";

describe("Test For Solana Profile API", () => {
  it("It should response 200 for bonfida.bit", async () => {
    const res = await queryClient("/profile/solana/bonfida.sol");
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.address).toBe("HKKp49qGWXd639QsuH7JiLijfVW5UtCVY4s1n2HANwEA");
  });
  it("It should response 200 for 🍍.sol", async () => {
    const res = await queryClient("/profile/solana/🍍.sol");
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.address).toBe("CnNHzcp7L4jKiA2Rsca3hZyVwSmoqXaT8wGwzS8WvvB2");
    expect(json.displayName).toBeTruthy();
  });
  it("It should response 200 for 抹茶.sol", async () => {
    const res = await queryClient("/profile/solana/抹茶.sol");
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.address).toBeTruthy();
  });
  it("It should response 200 for test.🇺🇸.sol", async () => {
    const res = await queryClient("/profile/solana/test.🇺🇸.sol");
    expect(res.status).toBe(404);
    const json = await res.json();
    expect(json.error).toBe("Not Found");
  });
});
