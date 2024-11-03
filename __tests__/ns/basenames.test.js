import { queryClient } from "../../utils/test-utils";

describe("Test For BaseNames NS API", () => {
  it("It should response 200 for lightinyourlife.base.eth", async () => {
    const res = await queryClient("/ns/basenames/lightinyourlife.base.eth");
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.address).toBe("0xb8fc77f0197ea5a81ce94ba2870fd7f4eb09b635");
  });
  it("It should response 200 for 0xb8fc77f0197ea5a81ce94ba2870fd7f4eb09b635", async () => {
    const res = await queryClient(
      "/ns/basenames/0xb8fc77f0197ea5a81ce94ba2870fd7f4eb09b635"
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.identity).toBe("lightinyourlife.base.eth");
  });
  it("It should response 200 for drishka.base", async () => {
    const res = await queryClient("/ns/basenames/drishka.base");
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.address).toBe("0x9f80825a2a234cf3c7484b6042e572f707dcb05a");
  });
});
