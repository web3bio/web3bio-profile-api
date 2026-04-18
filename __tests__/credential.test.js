import { expectJsonCase } from "./helpers/api-assertions";

describe("Test For Credential API", () => {
  const cases = [
    {
      name: "ggmonster.farcaster",
      path: "/credential/ggmonster.farcaster",
      assertJson: (json) => {
        expect(json.isHuman.length).toBe(0);
        expect(json.isRisky[0].credentialSource).toBe("dmca");
        expect(json.isSpam[0].link).toBe("https://github.com/warpcast/labels");
      },
    },
    {
      name: "0xb6a5426b885172fb73d3c8fcf9612610612df707",
      path: "/credential/0xb6a5426b885172fb73d3c8fcf9612610612df707",
      assertJson: (json) => {
        expect(json.isRisky[0].id).toBe(
          "ethereum,0xb6a5426b885172fb73d3c8fcf9612610612df707",
        );
        expect(json.isRisky[0].value).toBe("true");
        expect(json.isRisky[0].credentialSource).toBe("hacker");
      },
    },
    {
      name: "supahmars.eth",
      path: "/credential/supahmars.eth",
      assertJson: (json) => {
        expect(json.isHuman[0].id).toBe("ens,supahmars.eth");
        expect(json.isHuman[0].credentialSource).toBe("dentity");
        expect(json.isHuman[0].platform).toBe("dentity");
      },
    },
    {
      name: "0xhelena.eth",
      path: "/credential/0xhelena.eth",
      assertJson: (json) => {
        expect(json.isHuman[0].value).toBe("true");
      },
    },
    {
      name: "0x54503eeded1fc55b94330bf82092ad41a76a8683",
      path: "/credential/0x54503eeded1fc55b94330bf82092ad41a76a8683",
      assertJson: (json) => {
        expect(json.isHuman.some((x) => x.credentialSource === "binance")).toBe(
          true,
        );
        expect(json.isHuman.some((x) => x.credentialSource === "coinbase")).toBe(
          true,
        );
      },
    },
  ];

  it.each(cases)("$name", async ({ path, assertJson }) => {
    await expectJsonCase({ path, assertJson });
  });
});
