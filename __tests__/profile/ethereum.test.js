import {
  expectJsonCase,
  findByPlatform,
  requestJson,
} from "../helpers/api-assertions";

describe("Test For Ethereum Profile API", () => {
  const cases = [
    {
      name: "gamedb.eth",
      path: "/profile/ethereum/gamedb.eth",
      assertJson: (json) => {
        expect(json.address).toBe("0x18deee9699526f8c8a87004b2e4e55029fb26b9a");
      },
    },
    {
      name: "0x18deee9699526f8c8a87004b2e4e55029fb26b9a",
      path: "/profile/ethereum/0x18deee9699526f8c8a87004b2e4e55029fb26b9a",
      assertJson: (json) => {
        expect(json.identity).toBe("planetable.eth");
        expect(json.createdAt).toBe("2022-02-15T11:02:56.000Z");
      },
    },
    {
      name: "yisiliu.eth",
      path: "/profile/ethereum/yisiliu.eth",
      assertJson: (json) => {
        expect(json.platform).toBe("ens");
      },
    },
    {
      name: "taoli.eth",
      path: "/profile/ethereum/taoli.eth",
      assertJson: () => {},
    },
  ];

  it.each(cases)("$name", async ({ path, assertJson }) => {
    await expectJsonCase({ path, assertJson });
  });

  it("sio.eth keeps profile/ethereum and profile/ens address aligned", async () => {
    const { json } = await requestJson("/profile/ethereum/sio.eth");
    const { json: ensJson } = await requestJson("/profile/ens/sio.eth");
    expect(json.address).toBe(ensJson.address);
  });

  it("0xf484... matches ens address in profile/wijuwiju.eth", async () => {
    const { json } = await requestJson(
      "/profile/ethereum/0xf4844a06d4f995c4c03195afcb5aa59dcbb5b4fc",
    );
    const { json: universalJson } = await requestJson("/profile/wijuwiju.eth");
    expect(json.address).toBe(findByPlatform(universalJson, "ens").address);
  });
});
