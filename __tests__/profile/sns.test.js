import { queryClient } from "../../utils/test-utils";

describe("Test For Solana Profile API", () => {
  it("It should response 200 for bonfida.sol", async () => {
    const res = await queryClient("/profile/sns/bonfida.sol");
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.address).toBe("HKKp49qGWXd639QsuH7JiLijfVW5UtCVY4s1n2HANwEA");
  });
  it("It should response 200 for 🍍.sol", async () => {
    const res = await queryClient("/profile/sns/🍍.sol");
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.address).toBe("8fe1EFcmz4BYeX6zGp6HUdoaHjVYhzsv599ub52WJbos");
    expect(json.displayName).toBeTruthy();
  });
  it("It should response 200 for 7059.sol", async () => {
    const res = await queryClient("/profile/sns/7059.sol");
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.address).toBeTruthy();
  });
  it("It should response 200 for 0x33.sol", async () => {
    const res = await queryClient("/profile/sns/0x33.sol");
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.avatar).toBeTruthy();
  });
  it("It should response 200 for lewsales.sol", async () => {
    const res = await queryClient("/profile/sns/lewsales.sol");
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.contenthash).toBe(
      "ipfs://QmNzcrH1Rf9765XeGBmXTtQs8jbefGf9x3VQJcCJsQjvqx",
    );
  });
  it("It should response 200 for anarcrypt.sol", async () => {
    const res = await queryClient("/profile/sns/anarcrypt.sol");
    expect(res.status).toBe(200);
  });
  it("It should response 200 for CHzTBh4fvhsszz1jrQhThtfVDBcLppaiwrhJ1dJGaXoK", async () => {
    const res = await queryClient(
      "/profile/sns/CHzTBh4fvhsszz1jrQhThtfVDBcLppaiwrhJ1dJGaXoK",
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.displayName).toBe("CHzTB...GaXoK");
  });
});
