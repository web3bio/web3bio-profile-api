import { queryClient } from "../../utils/test-utils";

describe("Test For BaseNames NS API", () => {
  it("It should response 200 for jesse.base.eth", async () => {
    const res = await queryClient("/ns/basenames/jesse.base.eth");
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.address).toBe("0x2211d1d0020daea8039e46cf1367962070d77da9");
  });
  it("It should response 200 for 0xce40d3c0041e7720ad2bc7a841ff05cc7923532d", async () => {
    const res = await queryClient(
      "/ns/basenames/0xce40d3c0041e7720ad2bc7a841ff05cc7923532d",
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.identity).toBe("fitz.base.eth");
  });
  it("It should response 200 for drishka.base", async () => {
    const res = await queryClient("/ns/basenames/drishka.base");
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.address).toBe("0x9f80825a2a234cf3c7484b6042e572f707dcb05a");
  });
});
