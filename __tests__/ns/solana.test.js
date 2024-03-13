import { queryClient } from "../../utils/test-utils";

describe("Test For Solana NS API", () => {
  it("It should response 200 for bonfida.sol", async () => {
    const res = await queryClient("/ns/solana/bonfida.sol");
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.address).toBe("HKKp49qGWXd639QsuH7JiLijfVW5UtCVY4s1n2HANwEA");
  });
  it("It should response 200 for sujiyan.sol", async () => {
    const res = await queryClient("/ns/solana/sujiyan.sol");
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.address).toBe("2E3k7otC558kJJsK8wV8oehXf2VxPRQA3LtyW2mvF6w5");
  });
  it("It should response 200 for 0xbillys.sol", async () => {
    const res = await queryClient("/ns/solana/0xbillys.sol");
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.avatar).toBeTruthy()
  });
  it("It should response 200 for _tesla.sol", async () => {
    const res = await queryClient("/ns/solana/_tesla.sol");
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.avatar).toBeTruthy()
    expect(json.links.github.handle).toBe('test')
  });
  it("It should response 200 for wallet-guide-9.sol", async () => {
    const res = await queryClient("/ns/solana/_tesla.sol");
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.avatar).toBeTruthy()
    expect(json.links.website.handle).toBe('google.com')
  });
});
