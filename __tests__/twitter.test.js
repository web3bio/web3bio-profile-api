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
  it("It should response 200 for VitalikButerin", async () => {
    const res = await queryClient("/profile/twitter/VitalikButerin");
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.identity).toBe("vitalikbuterin");
    expect(json.links.twitter.handle).toBe("vitalikbuterin");
    expect(json.displayName).toBe("vitalik.eth");
    expect(json.links.website.handle).toBe("vitalik.ca");
  });
  it("It should response 200 for BrantlyMillegan", async () => {
    const res = await queryClient("/profile/twitter/BrantlyMillegan");
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.identity).toBe("brantlymillegan");
    expect(json.links.twitter.handle).toBe("brantlymillegan");
    expect(json.displayName).toBe("brantly.eth");
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
