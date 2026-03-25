import { queryClient } from "../../utils/test-utils";

describe("Test For Profile Web2 API", () => {
  it("It should response 200 for sujiyan.eth", async () => {
    const res = await queryClient("/profile/sujiyan.eth/web2");
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.some((x) => x.platform === "instagram")).toBe(true);
    expect(json.some((x) => x.platform === "reddit")).toBe(true);
    expect(json.some((x) => x.platform === "github")).toBe(true);
  });
});
