import { queryClient } from "../utils/test-utils";

describe("Test For Linea Profile API", () => {
  it("It should response 200 for 184.linea.eth", async () => {
    const res = await queryClient("/profile/linea/184.linea");
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.address).toBe("0xc28de09ad1a20737b92834943558ddfcc88d020d");
  });
  it("It should response 200 for 0xthor.linea.eth", async () => {
    const res = await queryClient("/profile/linea/0xthor");
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.email).toBe("thorjr88@gmail.com");
  });
  it("It should response 200 for alhemi.linea.eth", async () => {
    const res = await queryClient("/profile/linea/alhemi.linea.eth");
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.address).toBe("0x455c3b6b9f25e35b02037a28c3b6a6c8f1ab56c8");
  });
  it("It should response 200 for 0x5410ee50064b403b6f799dcd4ae9ca5d02e78f59", async () => {
    const res = await queryClient(
      "/profile/linea/0x5410ee50064b403b6f799dcd4ae9ca5d02e78f59"
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.identity).toBe("funnymemes.linea.eth");
  });
  it("It should response 200 for tacoz.linea.eth", async () => {
    const res = await queryClient("/profile/linea/tacoz.linea");
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.identity).toBe("tacoz.linea.eth");
  });
});
