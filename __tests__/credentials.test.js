import { queryClient } from "../utils/test-utils";

describe("Test For Credentials API", () => {
  it("It should response 200 for ggmonster.farcaster", async () => {
    const res = await queryClient("/credentials/ggmonster.farcaster");
    expect(res.status).toBe(200);
    const json = await res.json();

    expect(json[0].id).toBe("farcaster,ggmonster");
    expect(json[0].credentials.isRisky.sources[0].value).toBe("dmca");
    expect(json[0].credentials.isRisky.sources[0].link).toBe(
      "https://web3.bio/p/dmca-notice-policy",
    );
    expect(json[0].credentials.isSpam.value).toBeTruthy();
  });
  it("It should response 200 for 0xb6a5426b885172fb73d3c8fcf9612610612df707", async () => {
    const res = await queryClient(
      "/credentials/0xb6a5426b885172fb73d3c8fcf9612610612df707",
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json[0].id).toBe(
      "ethereum,0xb6a5426b885172fb73d3c8fcf9612610612df707",
    );
    expect(json[0].credentials.isRisky.sources[0].value).toBe("hacker");
  });
  it("It should response 200 for supahmars.eth", async () => {
    const res = await queryClient("/credentials/supahmars.eth");
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json[0].id).toBe("ens,supahmars.eth");
    expect(json[0].credentials.isHuman.sources[0].value).toBe("true");
  });
  it("It should response 200 for 0xhelena.eth", async () => {
    const res = await queryClient("/credentials/0xhelena.eth");
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json[1].credentials.isSpam.value).toBe(false);
  });
  it("It should response 200 for 0x54503eeded1fc55b94330bf82092ad41a76a8683", async () => {
    const res = await queryClient(
      "/credentials/0x54503eeded1fc55b94330bf82092ad41a76a8683",
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json[0].credentials.isHuman.value).toBe(true);
    expect(json[0].credentials.isHuman.sources[0].dataSource).toBe("binance");
    expect(json[0].credentials.isHuman.sources[1].dataSource).toBe("coinbase");
  });
});
