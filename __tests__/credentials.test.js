import { queryClient } from "../utils/test-utils";

describe("Test For Credential API", () => {
  it("It should response 200 for ggmonster.farcaster", async () => {
    const res = await queryClient("/credential/ggmonster.farcaster");
    expect(res.status).toBe(200);
    const json = await res.json();

    expect(json.isHuman.length).toBe(0);
    expect(json.isSpam[0].link).toBe("https://github.com/warpcast/labels");
  });
  it("It should response 200 for 0xb6a5426b885172fb73d3c8fcf9612610612df707", async () => {
    const res = await queryClient(
      "/credential/0xb6a5426b885172fb73d3c8fcf9612610612df707",
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.isRisky[0].id).toBe(
      "ethereum,0xb6a5426b885172fb73d3c8fcf9612610612df707",
    );
    expect(json.isRisky[0].value).toBe("true");
    expect(json.isRisky[0].dataSource).toBe("hacker");
  });
  it("It should response 200 for supahmars.eth", async () => {
    const res = await queryClient("/credential/supahmars.eth");
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.isHuman[0].id).toBe("ens,supahmars.eth");
    expect(json.isHuman[0].label).toBe("Humanity Verified");
    expect(json.isHuman[0].platform).toBe("dentity");
  });
  it("It should response 200 for 0xhelena.eth", async () => {
    const res = await queryClient("/credential/0xhelena.eth");
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.isHuman[0].value).toBe("true");
  });
  it("It should response 200 for 0x54503eeded1fc55b94330bf82092ad41a76a8683", async () => {
    const res = await queryClient(
      "/credentials/0x54503eeded1fc55b94330bf82092ad41a76a8683",
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.isHuman.some((x) => x.dataSource === "binance")).toBe(true);
    expect(json.isHuman.some((x) => x.dataSource === "coinbase")).toBe(true);
  });
});
