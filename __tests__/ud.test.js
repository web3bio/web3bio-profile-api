import { queryClient } from "../utils/test-utils";

describe("Test For Unstoppable Domains Profile API", () => {
  it("It should response 200 for 0x0da0ee86269797618032e56a69b1aad095c581fc", async () => {
    const res = await queryClient(
      "/profile/unstoppabledomains/0x0da0ee86269797618032e56a69b1aad095c581fc",
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.links.twitter.handle).toBe("bgm38");
    expect(json.links.website.sources.includes("keybase")).toBeTruthy();
    expect(json.address).toBe("0x0da0ee86269797618032e56a69b1aad095c581fc");
  });
  it("It should response 200 for sandy.nft", async () => {
    const res = await queryClient("/profile/unstoppabledomains/sandy.nft");
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.links.youtube.handle).toBe("@sandycarter3993");
    expect(json.contenthash).toBe(
      "ipfs://Qmar8DH5xBihbGU449zKAg4sx7ahHbFZgksYHKBFFhfVq7",
    );
  });
  it("It should response 200 for al.x", async () => {
    const res = await queryClient("/profile/unstoppabledomains/al.x");
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.address).toBe("0x2ccff304ef578b238ee82e1d1d53c34e80b48ad6");
  });
  it("It should response 404 for sujiyan.eth", async () => {
    const res = await queryClient("/profile/unstoppabledomains/sujiyan.eth");
    expect(res.status).toBe(404);
  });
  it("It should response 404 for nyk.app", async () => {
    const res = await queryClient("/profile/unstoppabledomains/nyk.app");
    expect(res.status).toBe(404);
  });
});
