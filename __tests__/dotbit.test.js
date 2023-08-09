import { queryClient } from "../utils/test-utils";

describe("Test For Lens Profile API", () => {
  it("It should response 200 for jeffx.bit", async () => {
    const res = await queryClient("/profile/dotbit/jeffx.bit");
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.platform).toBe("dotbit");
    expect(json.address).toBe("0x1d643fac9a463c9d544506006a6348c234da485f");
  });
  it("It should response 404 for 0x42e573b38e41cfa26be5d85235368e596dc6d12b", async () => {
    const res = await queryClient(
      "/profile/dotbit/0x42e573b38e41cfa26be5d85235368e596dc6d12b"
    );
    expect(res.status).toBe(404);
  });
  it("It should response 200 for suji.bit", async () => {
    const res = await queryClient("/profile/dotbit/suji.bit");
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.avatar).toBe("https://display.did.id/identicon/suji.bit");
    expect(json.address).toBeTruthy();
  });
  it("It should response 404 for 0x0000000000000000000000000000000000000001", async () => {
    const res = await queryClient(
      "/profile/dotbit/0x0000000000000000000000000000000000000001"
    );
    expect(res.status).toBe(404);
  });
  it("It should response 200 for mitchatmask.bit", async () => {
    const res = await queryClient("/profile/dotbit/mitchatmask.bit");
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.addresses.eth).toBeTruthy();
    expect(json.links.nextid.handle).toBeTruthy();
  });
  it("It should response 200 for test0920.bit", async () => {
    const res = await queryClient("/profile/dotbit/test0920.bit");
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.address).toBe("0x4271b15dca69f8c1c942c64028dbd3b84c5d03b0");
  });
});

