import { GET } from "@/app/api/profile/solana/[handle]/route";
import { NextRequest } from "next/server";

describe("Test For Solana Profile API", () => {
  it("It should response 200 for sujiyan.sol", async () => {
    const req = {
      nextUrl: {
        searchParams: new URLSearchParams({ handle: "sujiyan.sol" }),
      },
    } as NextRequest;
    const res = await GET(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.address).toBe("2E3k7otC558kJJsK8wV8oehXf2VxPRQA3LtyW2mvF6w5");
    expect(json.platform).toBe("sns");
  });
  it("It should response 200 for 46YaTaa8Xa1xFEVDxPa4CVJpzsNADocgixS51HLNCS4Y", async () => {
    const req = {
      nextUrl: {
        searchParams: new URLSearchParams({
          handle: "46YaTaa8Xa1xFEVDxPa4CVJpzsNADocgixS51HLNCS4Y",
        }),
      },
    } as NextRequest;
    const res = await GET(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.address).toBe("46YaTaa8Xa1xFEVDxPa4CVJpzsNADocgixS51HLNCS4Y");
    expect(json.platform).toBe("sns");
  });
});
