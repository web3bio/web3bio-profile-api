import { queryClient } from "../utils/test-utils";

describe("Test For NS API web2 query", () => {
  it("It should response 200 for nostr,sujiyan", async () => {
    const res = await queryClient("/ns/nostr,yuopu6");
    // single identity
    expect(res.status).toBe(404);
  });
  it("It should response 200 for tedko.github", async () => {
    const res = await queryClient("/ns/tedko.github");
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json[0].identity).toBe("sujiyan.eth");
  });
  it("It should response 200 for nicksdjohnson.twitter", async () => {
    const res = await queryClient("/ns/nicksdjohnson.twitter");
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json[0].identity).toBe("nick.eth");
  });
  it("It should response 200 for sujiyan.discord", async () => {
    const res = await queryClient("/ns/sujiyan.discord");
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json[0].identity).toBe("sujiyan.eth");
  });
  it("It should response 200 for wgmeets.instagram", async () => {
    const res = await queryClient("/ns/wgmeets.instagram");
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json[0].identity).toBe("wgmeets.eth");
  });
  it("It should response 200 for jktedko.reddit", async () => {
    const res = await queryClient("/ns/jktedko.reddit");
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json[0].identity).toBe("sujiyan.eth");
  });
  it("It should response 200 for 0xhelena.bluesky", async () => {
    const res = await queryClient("/ns/0xhelena.bluesky");
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json[0].identity).toBe("0xhelena.eth");
  });
  it("It should response 200 for benzweerachat.linkedin", async () => {
    const res = await queryClient("/ns/benzweerachat.linkedin");
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json[0].identity).toBe("cbenz.eth");
  });
  it("It should response 200 for igorls.facebook", async () => {
    const res = await queryClient("/ns/igorls.facebook");
    // others all web2
    expect(res.status).toBe(404);
  });
});
