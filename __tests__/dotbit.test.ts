import { GET } from "@/app/api/profile/dotbit/[handle]/route";
import { generateRequestBody } from "@/utils/test-utils";

describe("Test For Dotbit Profile API", () => {
  it("It should response 200 for jeffx.bit", async () => {
    const res = await GET(generateRequestBody("jeffx.bit"));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.platform).toBe("dotbit");
    expect(json.address).toBe("0x1d643fac9a463c9d544506006a6348c234da485f");
  });
  it("It should response 404 for 0x42e573b38e41cfa26be5d85235368e596dc6d12b", async () => {
    const res = await GET(
      generateRequestBody("0x42e573b38e41cfa26be5d85235368e596dc6d12b")
    );
    expect(res.status).toBe(404);
  });
  it("It should response 404 for suji.bit", async () => {
    const res = await GET(generateRequestBody("suji.bit"));
    expect(res.status).toBe(404);
  });
  it("It should response 404 for 0x0000000000000000000000000000000000000001", async () => {
    const res = await GET(
      generateRequestBody("0x0000000000000000000000000000000000000001")
    );
    expect(res.status).toBe(404);
  });
  it("It should response 404 for mitchatmask.bit", async () => {
    const res = await GET(generateRequestBody("mitchatmask.bit"));
    expect(res.status).toBe(404);
  });
  it("It should response 200 for satoshi.bit", async () => {
    const res = await GET(generateRequestBody("satoshi.bit"));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.address).toBe("0xee8738e3d3e80482526b33c91dd343caef68e41a");
  });
  it("It should response 200 for phone.bit", async () => {
    const res = await GET(generateRequestBody("phone.bit"));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.address).toBe("tbrkixogyva7xmysduyis6asvapxkkk8ra");
  });
  it("It should response 200 for kingsgam.bit", async () => {
    const res = await GET(generateRequestBody("kingsgam.bit"));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.avatar).toBeTruthy();
  });
  it("It should response 200 for bestcase.bit", async () => {
    const res = await GET(generateRequestBody("bestcase.bit"));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.contenthash).toBeTruthy();
  });
});
