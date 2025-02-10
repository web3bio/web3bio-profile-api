import { queryClient } from "../../utils/test-utils";

describe("Test For Linea NS API", () => {
  it("It should response 200 for suji.linea.eth", async () => {
    const res = await queryClient("/ns/linea/suji");
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.address).toBe("0x15fecfa8fa295ad7383d84d172dbe51792fa95bb");
  });
  it("It should response 200 for 0xc28de09ad1a20737b92834943558ddfcc88d020d", async () => {
    const res = await queryClient(
      "/ns/linea/0xc28de09ad1a20737b92834943558ddfcc88d020d"
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.identity).toBe("184.linea.eth");
  });
});
