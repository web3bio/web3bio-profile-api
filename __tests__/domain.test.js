import { expectJsonCase } from "./helpers/api-assertions";

describe("Test For Domain API", () => {
  const cases = [
    {
      name: "ens,sujiyan.eth",
      path: "/domain/ens,sujiyan.eth",
      assertJson: (json) => {
        expect(json.identity).toBe("sujiyan.eth");
        expect(json.firstTxAt).toBe("2020-01-24T16:01:08.000Z");
      },
    },
    {
      name: "bonfida.sol",
      path: "/domain/bonfida.sol",
      assertJson: (json) => {
        expect(json.resolvedAddress).toBe(
          "Fw1ETanDZafof7xEULsnq9UY6o71Tpds89tNwPkWLb1v",
        );
      },
    },
    {
      name: "dwr.farcaster not found",
      path: "/domain/dwr.farcaster",
      expectedStatus: 404,
      assertJson: () => {},
    },
    {
      name: "linea,184.linea.eth",
      path: "/domain/linea,184.linea.eth",
      assertJson: (json) => {
        expect(json.addresses.dogecoin).toBe("D8ehuDjCuZkWLGQoaqbghFd9fJ4a72PKTh");
      },
    },
    {
      name: "0xc28de09ad1a20737b92834943558ddfcc88d020d",
      path: "/domain/0xc28de09ad1a20737b92834943558ddfcc88d020d",
      assertJson: (json) => {
        expect(json.domains.some((x) => x.identity === "danny.box")).toBeTruthy();
      },
    },
  ];

  it.each(cases)("$name", async ({ path, expectedStatus, assertJson }) => {
    await expectJsonCase({ path, expectedStatus, assertJson });
  });
});
