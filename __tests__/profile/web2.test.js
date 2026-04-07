import { queryClient } from "../../utils/test-utils";

describe("Test For Profile Web2 API", () => {
  it("It should response 200 for sujiyan.eth", async () => {
    const res = await queryClient("/profile/web2/sujiyan.eth");
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.some((x) => x.platform === "instagram")).toBe(true);
    expect(json.some((x) => x.platform === "reddit")).toBe(true);
    expect(json.some((x) => x.platform === "github")).toBe(true);
    expect(
      json.find((x) => x.platform === "instagram").links.website.handle,
    ).toBe("dimension.im");
  });
  it("It should response 200 for accountless.eth", async () => {
    const res = await queryClient("/profile/web2/accountless.eth");
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(
      json.find((x) => x.platform === "ens").links.website.handle,
    ).toBe("linktr.ee/alexanderchopan");
    expect(
      json.find((x) => x.platform === "github").links.website.handle,
    ).toBe("linktr.ee/alexanderchopan");
  });
});
