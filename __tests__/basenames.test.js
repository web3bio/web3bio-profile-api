import { queryClient } from "../utils/test-utils";

describe("Test For BaseNames Profile API", () => {
  it("It should response 200 for suji.base", async () => {
    const res = await queryClient("/profile/basenames/suji.base");
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.address).toBe("0xc9d18042baabe51d38297d1f3520cfbef0c83c32");
  });
  it("It should response 200 for tony.base.eth", async () => {
    const res = await queryClient("/profile/basenames/tony.base.eth");
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.links.twitter.handle).toBe("tonmfer");
  });
  it("It should response 200 for alexgrover", async () => {
    const res = await queryClient("/profile/basenames/alexgrover");
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.address).toBe("0xd6507fc98605eab8775f851c25a5e09dc12ab7a7");
  });
  it("It should response 200 for 0x6aefa01456ffbe8b69633e46e4b7e36a7ca4b29e", async () => {
    const res = await queryClient(
      "/profile/basenames/0x6aefa01456ffbe8b69633e46e4b7e36a7ca4b29e"
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.identity).toBe("ibeace.base.eth");
  });
});
