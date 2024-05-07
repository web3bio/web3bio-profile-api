import { testApiHandler } from "next-test-api-route-handler";
import * as appHandler from "@/app/api/profile/sns/[handle]/route";
describe("Test For Solana Profile API", () => {
  it("It should response 200 for bonfida.sol", async () => {
    await testApiHandler({
      params: { handle: "bonfida.sol" },
      appHandler,
      test: async ({ fetch }) => {
        const res = await fetch({ method: "GET" });
        expect(res.status).toBe(200);
        const json = await res.json();
        expect(json.address).toBe(
          "HKKp49qGWXd639QsuH7JiLijfVW5UtCVY4s1n2HANwEA"
        );
      },
    });
  });
  // it("It should response 200 for 🍍.sol", async () => {
  //   const res = await GET(generateRequestBody("🍍.sol"));
  //   expect(res.status).toBe(200);
  //   const json = await res.json();
  //   expect(json.address).toBe("CnNHzcp7L4jKiA2Rsca3hZyVwSmoqXaT8wGwzS8WvvB2");
  //   expect(json.displayName).toBeTruthy();
  // });
  // it("It should response 200 for 7059.sol", async () => {
  //   const res = await GET(generateRequestBody("7059.sol"));
  //   expect(res.status).toBe(200);
  //   const json = await res.json();
  //   expect(json.address).toBeTruthy();
  //   expect(json.email).toBe("test@gmail.com");
  //   expect(json.links.twitter.handle).toBe("bonfida");
  // });
  // it("It should response 200 for 0x33.sol", async () => {
  //   const res = await GET(generateRequestBody("0x33.sol"));
  //   expect(res.status).toBe(200);
  //   const json = await res.json();
  //   expect(json.avatar).toBeTruthy();
  // });
  // it("It should response 200 for CHzTBh4fvhsszz1jrQhThtfVDBcLppaiwrhJ1dJGaXoK", async () => {
  //   const res = await GET(
  //     generateRequestBody("CHzTBh4fvhsszz1jrQhThtfVDBcLppaiwrhJ1dJGaXoK")
  //   );
  //   expect(res.status).toBe(200);
  //   const json = await res.json();
  //   expect(json.displayName).toBe("CHzTB...GaXoK");
  // });
});
