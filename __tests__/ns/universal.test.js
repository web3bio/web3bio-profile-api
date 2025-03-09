import { queryClient } from "../../utils/test-utils";

describe("Test For Universal NS API", () => {
  it("It should response 200 for sujiyan.lens", async () => {
    const res = await queryClient("/ns/sujiyan.lens");
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(
      json.find((x) => x.platform === "lens")?.address ===
        json.find((x) => x.platform === "ens")?.address,
    );
  });

  it("It should response 200 data for stani.lens", async () => {
    const res = await queryClient("/ns/stani.lens");
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json[0].identity).toBe("stani.lens");
  });

  it("It should response 404 data for jeffx.bit", async () => {
    const res = await queryClient("/ns/jeffx.bit");
    expect(res.status).toBe(404);
  });

  it("It should response 200 data for gamedb.eth", async () => {
    const res = await queryClient("/profile/gamedb.eth");
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.find((x) => x.platform === "ens").identity).toBe("gamedb.eth");
  });
  it("It should response 200 data for livid.farcaster", async () => {
    const res = await queryClient("/ns/livid.farcaster");
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.find((x) => x.platform === "farcaster").identity).toBe("livid");
  });
  it("It should response 200 data for luc.eth", async () => {
    const res = await queryClient("/ns/luc.eth");
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(
      json.filter(
        (x) =>
          x.identity.endsWith(".eth") && x.platform === "unstoppabledomains",
      ).length,
    ).toBe(0);
  });
  it("It should response 200 data for 184.linea.eth", async () => {
    const res = await queryClient("/ns/184.linea");
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.length > 0).toBeTruthy();
    expect(json[0].identity).toBe("184.linea.eth");
    expect(json[1].platform).toBe("ens");
  });
  it("It should response 200 data for 0xc28de09ad1a20737b92834943558ddfcc88d020d", async () => {
    const res = await queryClient(
      "/ns/0xc28de09ad1a20737b92834943558ddfcc88d020d",
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.some((x) => x.platform === "linea")).toBe(true);
  });
  it("It should response 200 data for linea,184.linea", async () => {
    const res = await queryClient("/ns/linea,184.linea");
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.some((x) => x.platform === "linea")).toBe(true);
  });
  it("It should response 200 data for solana,46YaTaa8Xa1xFEVDxPa4CVJpzsNADocgixS51HLNCS4Y", async () => {
    const res = await queryClient(
      "/ns/solana,46YaTaa8Xa1xFEVDxPa4CVJpzsNADocgixS51HLNCS4Y",
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.some((x) => x.platform === "linea")).toBe(false);
  });
});
