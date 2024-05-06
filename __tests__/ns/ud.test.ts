import { GET } from "@/app/api/ns/unstoppabledomains/[handle]/route";
import { generateRequestBody } from "@/utils/test-utils";
describe("Test For Unstoppable Domains NS API", () => {
  it("It should response 200 for sandy.x", async () => {
    const res = await GET(generateRequestBody("sandy.x"));
    expect(res.status).toBe(200);
  });
  it("It should response 200 for al.x", async () => {
    const res = await GET(generateRequestBody("al.x"));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.address).toBe("0x2ccff304ef578b238ee82e1d1d53c34e80b48ad6");
  });
});
