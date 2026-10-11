import { expectJsonCase } from "../helpers/api-assertions";

describe("Test For Solana Profile API", () => {
  const cases = [
    {
      name: "bonfida.sns",
      path: "/profile/sns/bonfida.sns",
      assertJson: (json) => {
        expect(json.address).toBe(
          "Fw1ETanDZafof7xEULsnq9UY6o71Tpds89tNwPkWLb1v",
        );
      },
    },
    {
      name: "🍍.sns",
      path: "/profile/sns/🍍.sns",
      assertJson: (json) => {
        expect(json.address).toBe(
          "8fe1EFcmz4BYeX6zGp6HUdoaHjVYhzsv599ub52WJbos",
        );
        expect(json.displayName).toBeTruthy();
      },
    },
    {
      name: "7059.sns",
      path: "/profile/sns/7059.sns",
      assertJson: (json) => {
        expect(json.address).toBeTruthy();
      },
    },
    {
      name: "0x33.sns",
      path: "/profile/sns/0x33.sns",
      assertJson: (json) => {
        expect(json.avatar).toBeTruthy();
      },
    },
    {
      name: "lewsales.sns",
      path: "/profile/sns/lewsales.sns",
      assertJson: (json) => {
        expect(json.contenthash).toBe("ipfs://lewsales.blockchain");
      },
    },
    {
      name: "anarcrypt.sns",
      path: "/profile/sns/anarcrypt.sns",
      assertJson: () => {},
    },
    {
      name: "CHzTBh4fvhsszz1jrQhThtfVDBcLppaiwrhJ1dJGaXoK",
      path: "/profile/sns/CHzTBh4fvhsszz1jrQhThtfVDBcLppaiwrhJ1dJGaXoK",
      assertJson: (json) => {
        expect(json.displayName).toBe("CHzTB...GaXoK");
      },
    },
  ];

  it.each(cases)("$name", async ({ path, assertJson }) => {
    await expectJsonCase({ path, assertJson });
  });
});
