import { queryClient } from "../../utils/test-utils";

describe("Test For ENS Profile API", () => {
  it("It should response 200 for brantly.eth", async () => {
    const res = await queryClient("/profile/ens/brantly.eth");
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.address).toBeTruthy();
    expect(json.status).toBe(
      "building an onchain social graph for ethereum accounts",
    );
    expect(json.createdAt).toBe("2017-06-15T02:40:38.000Z");
    expect(json.links.twitter.handle).toBe("brantlymillegan");
    expect(json.links.twitter.link).toBe("https://x.com/brantlymillegan");
  });
  it("It should response 200 for dr3a.eth", async () => {
    const res = await queryClient("/profile/ens/dr3a.eth");
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.links.lens).toBeTruthy();
    expect(json.links.farcaster).toBeTruthy();
  });
  it("It should response 404 for xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx.eth", async () => {
    const res = await queryClient(
      "/profile/ens/xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx.eth",
    );
    expect(res.status).toBe(404);
    const json = await res.json();
    expect(json.error).toBe("Invalid Resolved Address");
  });
  it("It should response 200 for sujiyan.eth", async () => {
    const res = await queryClient("/profile/ens/sujiyan.eth");
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.links.website.handle).toBe("mask.io");
    expect(json.contenthash).toBe(
      "ipns://k51qzi5uqu5di7afkyk8msyok5bxqlaudfzem68t8jilihitaz6ii523ve9tbw",
    );
    expect(json.address).toBe("0x7cbba07e31dc7b12bb69a1209c5b11a8ac50acf5");
  });
  it("It should response 200 for ricmoo.eth", async () => {
    const res = await queryClient("/profile/ens/ricmoo.eth");
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.links.github.handle).toBe("ricmoo");
  });
  it("It should response 200 for tartu.eth", async () => {
    const res = await queryClient("/profile/ens/tartu.eth");
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.address).toBe("0x161ea288055b58fb182f72b124a5d0f367b099e4");
  });
  it("It should response 404 for 0xcee81f7dd39d817f699a5c9eb93e3e6520f5b996", async () => {
    const res = await queryClient(
      "/profile/ens/0xcee81f7dd39d817f699a5c9eb93e3e6520f5b996",
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.identity).toBe("0xcee81f7dd39d817f699a5c9eb93e3e6520f5b996");
  });
  it("It should response 404 for 0x000000000000000000000000000000000000dEaD", async () => {
    const res = await queryClient(
      "/profile/ens/0x000000000000000000000000000000000000dEaD",
    );
    expect(res.status).toBe(404);
    const json = await res.json();
    expect(json.error).toBe("Invalid Identity or Domain");
  });
  it("It should response 404 for sujiyan.lens", async () => {
    const res = await queryClient("/profile/ens/sujiyan.lens");
    expect(res.status).toBe(404);
    const json = await res.json();
    expect(json.error).toBe("Invalid Identity or Domain");
  });
  it("It should response 404 for gothgorl.eth", async () => {
    const res = await queryClient("/profile/ens/gothgorl.eth");
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.links.website.handle).toBe("linktr.ee/starcaster12");
  });
  it("It should response 200 for offchainexample.eth", async () => {
    const res = await queryClient("/profile/ens/offchainexample.eth");
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.address).toBe("0xffd1ac3e8818adcbe5c597ea076e8d3210b45df5");
    // expect(json.email).toBeTruthy();
  });
  it("It should response 200 for ethidfoundation.eth", async () => {
    const res = await queryClient("/profile/ens/ethidfoundation.eth");
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.address).toBe("0x6856bd704089ee2ca0e5fb680716f1501c665095");
    // expect(json.email).toBeTruthy();
  });
});
