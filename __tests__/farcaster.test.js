import { queryClient } from "../utils/test-utils";

describe("Test For Farcaster Profile API", () => {
  it("It should response 200 for suji", async () => {
    const res = await queryClient("/profile/farcaster/suji");
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.identity).toBe("suji");
    expect(json.location).toBe("Chūō, Japan");
    expect(json.links.twitter.handle).toBe("suji_yan");
    expect(json.links.twitter.sources.includes("farcaster")).toBeTruthy();
  });
  it("It should response 200 for 0xc648dbbe0a20f850ff5ef2aa73ffb5a149befca2", async () => {
    const res = await queryClient(
      "/profile/farcaster/0xc648dbbe0a20f850ff5ef2aa73ffb5a149befca2",
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.identity).toBe("suji");
    expect(json.address).toBeTruthy();
    expect(json.links.farcaster.handle).toBe("suji");
    expect(json.createdAt).toBe("2023-11-07T22:14:15.000Z");
  });
  it("It should response 200 for farcaster", async () => {
    const res = await queryClient("/profile/farcaster/farcaster");
    expect(res.status).toBe(200);
    expect((await res.json()).displayName).toBe("Farcaster");
  });
  it("It should response 404 for 💗", async () => {
    const res = await queryClient("/profile/farcaster/💗");
    expect(res.status).toBe(404);
    const json = await res.json();
    expect(json.error).toBe("Invalid Identity or Domain");
  });
  it("It should response 200 for guoxin", async () => {
    const res = await queryClient("/profile/farcaster/guoxin");
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.address).toBe("0xeb8a789abd73e0e1af784fbc95a0547cd0458adc");
    expect(json.location).toBe("Los Angeles, California");
  });
  it("It should response 200 for dwr", async () => {
    const res = await queryClient("/profile/farcaster/dwr");
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.displayName).toBe("Dan Romero");
    expect(json.location).toBe("Los Angeles, California");
  });
  it("It should response 200 for dwr.eth", async () => {
    const res = await queryClient("/profile/farcaster/dwr.eth");
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.address).toBe("0xd7029bdea1c17493893aafe29aad69ef892b8ff2");
    expect(json.location).toBe("Los Angeles, California");
  });
  it("It should response 200 for farcaster%2C%233", async () => {
    const res = await queryClient("/profile/farcaster/farcaster%2C%233");
    expect(res.status).toBe(200);
    expect((await res.json()).identity).toBe("dwr.eth");
  });
});
