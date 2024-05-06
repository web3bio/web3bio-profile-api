import { GET } from "@/app/api/ns/ens/[handle]/route";
import { generateRequestBody } from "@/utils/test-utils";

describe("Test For ENS NS API", () => {
  it("It should response 200 for brantly.eth", async () => {
    const res = await GET(generateRequestBody("brantly.eth"));
    const json = await res.json();
    expect(json.address).toBeTruthy();
    expect(res.status).toBe(200);
  });
  it("It should response 404 for mcdonalds.eth", async () => {
    const res = await GET(generateRequestBody("mcdonalds.eth"));
    expect(res.status).toBe(404);
    expect((await res.json()).error).toBe("Invalid Resolved Address");
  });

  it("It should response 200 for sujiyan.eth", async () => {
    const res = await GET(generateRequestBody("sujiyan.eth"));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.platform).toBe("ens");
  });
  it("It should response 200 for vitalik.eth", async () => {
    const res = await GET(generateRequestBody("vitalik.eth"));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.platform).toBe("ens");
  });

  it("It should response 200 for 0xhelena.eth", async () => {
    const res = await GET(generateRequestBody("0xhelena.eth"));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.avatar).toBeTruthy();
  });
  it("It should response 200 for 0xc0074d4f69f4281d7a8eb4d266348ba9f7599e0a", async () => {
    const res = await GET(
      generateRequestBody("0xc0074d4f69f4281d7a8eb4d266348ba9f7599e0a")
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.platform).toBe("ethereum");
  });
});
