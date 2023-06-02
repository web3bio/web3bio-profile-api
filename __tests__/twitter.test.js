import { queryClient } from "../utils/test-utils";

const maxTimeOut = 10000;

describe("Test For Twitter Profile API", () => {
  it("It should response 200 for suji_yan", async () => {
    const res = await queryClient("/profile/twitter/suji_yan");
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.identity).toBe("suji_yan");
    expect(json.links.twitter.handle).toBe("suji_yan");
    expect(json.links.website.handle).toBe("mask.io");
  });
  it("It should response 200 for vitalik", async () => {
    const res = await queryClient("/profile/twitter/vitalik");
    expect(res.status).toBe(200);
    const json = await res.json()
    expect(json.identity).toBe("vitalik");
    expect(json.links.twitter.handle).toBe("vitalik");
    expect(json.links.website.handle).toBe("vainer");
  });
  it("It should response 404 for null", async () => {
    const res = await queryClient("/profile/twitter/null");
    expect(res.status).toBe(404);
    expect((await res.json()).error).toBe("Not Found");
  });
  it("It should response 404 for undefined", async () => {
    const res = await queryClient("/profile/twitter/undefined");
    expect(res.status).toBe(404);
    expect((await res.json()).error).toBe("Not Found");
  });
  it("It should response 200 for TheYisiLiu", async () => {
    const res = await queryClient("/profile/twitter/TheYisiLiu");
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.identity).toBe("theyisiliu");
    expect(json.links.twitter.handle).toBe("theyisiliu");
  });
});
