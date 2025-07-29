import { queryClient } from "../utils/test-utils";

describe("Test For Domain API", () => {
  it("It should response 200 for ens,sujiyan.eth", async () => {
    const res = await queryClient("/domain/ens,sujiyan.eth");
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.identity).toBe("sujiyan.eth");
  });
  it("It should response 200 for bonfida.sol", async () => {
    const res = await queryClient("/domain/bonfida.sol");
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.resolvedAddress).toBe(
      "Fw1ETanDZafof7xEULsnq9UY6o71Tpds89tNwPkWLb1v",
    );
  });
  it("It should response 200 for dwr.farcaster", async () => {
    const res = await queryClient("/domain/dwr.farcaster");
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.createdAt).toBe("2023-11-07T19:42:51.000Z");
  });
  it("It should response 200 for linea,184.liena.eth", async () => {
    const res = await queryClient("/domain/linea,184.linea.eth");
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.addresses.dogecoin).toBe("D8ehuDjCuZkWLGQoaqbghFd9fJ4a72PKTh");
  });
});
