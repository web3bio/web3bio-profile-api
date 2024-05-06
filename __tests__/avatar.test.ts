import { GET } from "@/app/api/avatar/[handle]/route";
import { generateRequestBody } from "@/utils/test-utils";

describe("Test For Avatar Service API", () => {
  it("It should response 200 for vitalik.eth", async () => {
    const res = await GET(generateRequestBody("vitalik.eth"));
    expect(res.status).toBe(307);
    const text = await res.text();
    expect(text.startsWith("https"));
  });
  it("It should response 200 for bonfida.sol", async () => {
    const res = await GET(generateRequestBody("bonfida.sol"));
    expect(res.status).toBe(307);
    const text = await res.text();
    expect(text.startsWith("<svg"));
  });
  it("It should response 200 for xxxxx.xxxxx", async () => {
    const res = await GET(generateRequestBody("xxxxx.xxxxx"));
    expect(res.status).toBe(307);
    const text = await res.text();
    expect(text.startsWith("<svg"));
  });
  it("It should response 200 for 46YaTaa8Xa1xFEVDxPa4CVJpzsNADocgixS51HLNCS4Y", async () => {
    const res = await GET(
      generateRequestBody("46YaTaa8Xa1xFEVDxPa4CVJpzsNADocgixS51HLNCS4Y")
    );
    expect(res.status).toBe(307);
    const text = await res.text();
    expect(text.startsWith("https"));
  });
});
