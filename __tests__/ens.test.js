import { queryClient } from "../utils/test-utils";

const maxTimeOut = 20000;
describe("Test For ENS Profile API", () => {
  it(
    "It should response 200 for brantly.eth",
    async () => {
      const res = await queryClient("/profile/ens/brantly.eth");
      const json = await res.json();
      expect(json.address).toBe("0x983110309620d911731ac0932219af06091b6744");
      expect(json.links.twitter.handle).toBe("brantlymillegan");
      expect(json.links.twitter.link).toBe(
        "https://twitter.com/brantlymillegan"
      );
      expect(json.links.discord.link).toBe("");
      expect(json.links.discord.handle).toBe("brantly.eth#9803");
      expect(res.status).toBe(200);
    },
    maxTimeOut
  );
  it("It should response 404 for mcdonalds.eth", async () => {
    const res = await queryClient("/profile/ens/mcdonalds.eth");
    expect(res.status).toBe(404);
    expect((await res.json()).error).toBe("Invalid Resolver Address");
  });
  it("It should response 404 for xxxxxxxxxxxxxxxxxxxxxxxxxxx.eth", async () => {
    const res = await queryClient(
      "/profile/ens/xxxxxxxxxxxxxxxxxxxxxxxxxxx.eth"
    );
    expect(res.status).toBe(404);
    const json = await res.json();
    expect(json.address).toBe(null);
    expect(json.error).toBe("Does Not Exist");
  });
  it("It should response 404 for solperdev.eth", async () => {
    const res = await queryClient("/profile/ens/solperdev.eth");
    expect(res.status).toBe(404);
    expect((await res.json()).error).toBe("Invalid Resolved Address");
  });
  it(
    "It should response 200 for sujiyan.eth",
    async () => {
      const res = await queryClient("/profile/ens/sujiyan.eth");
      expect(res.status).toBe(200);
    },
    maxTimeOut
  );
  it(
    "It should response 200 for vitalik.eth",
    async () => {
      const res = await queryClient("/profile/ens/vitalik.eth");
      expect(res.status).toBe(200);
    },
    maxTimeOut
  );
  it("It should response 200 for ricmoo.eth", async () => {
    const res = await queryClient("/profile/ens/ricmoo.eth");
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.links.github.handle).toBe("ricmoo");
  });
  it("It should response 200 for tartu.eth", async () => {
    const res = await queryClient("/profile/ens/tartu.eth");
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.address).toBe("0x161ea288055b58fb182f72b124a5d0f367b099e4");
  });
  it("It should response 404 for 0xcee81f7dd39d817f699a5c9eb93e3e6520f5b996", async () => {
    const res = await queryClient(
      "/profile/ens/0xcee81f7dd39d817f699a5c9eb93e3e6520f5b996"
    );
    expect(res.status).toBe(404);
    const json = await res.json();
    expect(json.error).toBe("Not Found");
  });
  it("It should response 200 for 0x934B510D4C9103E6a87AEf13b816fb080286D649", async () => {
    const res = await queryClient(
      "/profile/ens/0x934B510D4C9103E6a87AEf13b816fb080286D649"
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.identity).toBe("sujiyan.eth");
  });
  it("It should response 404 for 0x000000000000000000000000000000000000dEaD", async () => {
    const res = await queryClient(
      "/profile/ens/0x000000000000000000000000000000000000dEaD"
    );
    expect(res.status).toBe(404);
    const json = await res.json();
    expect(json.error).toBe("Invalid Address");
  });
});
