import { queryClient } from "../utils/test-utils";

const prod_base_url = "https://api.web3.bio";

describe("Test For Difference between prod and local", () => {
  jest.setTimeout(30_000);

  const nsBatchIds = [
    "ens,sujiyan.eth",
    "ens,vitalik.eth",
    "basenames,tony.base.eth",
    "farcaster,dwr.eth",
  ];

  const profileBatchIds = [
    "ens,sujiyan.eth",
    "ens,vitalik.eth",
    "tony.base.eth",
    "suji.fcast.id",
    "lens,stani.lens",
    "linea,0xthor.linea.eth",
    "184.linea",
    "farcaster,#3",
  ];

  const assertSame = async (path) => {
    const localRes = await queryClient(path);
    const prodRes = await queryClient(path, {}, prod_base_url);

    expect(localRes.status).toBe(prodRes.status);

    const localJson = await localRes.json();
    const prodJson = await prodRes.json();

    expect(localJson).toEqual(prodJson);
  };

  it("avatar.test.js /avatar/vitalik.eth", async () => {
    await assertSame("/avatar/vitalik.eth");
  });

  it("credential.test.js /credential/ggmonster.farcaster", async () => {
    await assertSame("/credential/ggmonster.farcaster");
  });

  it("domain.test.js /domain/ens,sujiyan.eth", async () => {
    await assertSame("/domain/ens,sujiyan.eth");
  });

  it("ns/basenames.test.js /ns/basenames/jesse.base.eth", async () => {
    await assertSame("/ns/basenames/jesse.base.eth");
  });

  it("ns/batch.test.js /ns/batch", async () => {
    await assertSame(
      `/ns/batch/${encodeURIComponent(JSON.stringify(nsBatchIds))}`,
    );
  });

  it("ns/ens.test.js /ns/ens/brantly.eth", async () => {
    await assertSame("/ns/ens/brantly.eth");
  });

  it("ns/ethereum.test.js /ns/ethereum/luc.eth", async () => {
    await assertSame("/ns/ethereum/luc.eth");
  });

  it("ns/farcaster.test.js /ns/farcaster/suji", async () => {
    await assertSame("/ns/farcaster/suji");
  });

  it("ns/lens.test.js /ns/lens/sujiyan.lens", async () => {
    await assertSame("/ns/lens/sujiyan.lens");
  });

  it("ns/linea.test.js /ns/linea/suji", async () => {
    await assertSame("/ns/linea/suji");
  });

  it("ns/sns.test.js /ns/sns/bonfida.sol", async () => {
    await assertSame("/ns/sns/bonfida.sol");
  });

  it("ns/solana.test.js /ns/solana/bonfida.sol", async () => {
    await assertSame("/ns/solana/bonfida.sol");
  });

  it("ns/ud.test.js /ns/unstoppabledomains/sandy.x", async () => {
    await assertSame("/ns/unstoppabledomains/sandy.x");
  });

  it("ns/universal.test.js /ns/sujiyan.lens", async () => {
    await assertSame("/ns/sujiyan.lens");
  });

  it("profile/basenames.test.js /profile/basenames/suji.base", async () => {
    await assertSame("/profile/basenames/suji.base");
  });

  it("profile/batch.test.js /profile/batch", async () => {
    await assertSame(
      `/profile/batch/${encodeURIComponent(JSON.stringify(profileBatchIds))}`,
    );
  });

  it("profile/ens.test.js /profile/ens/brantly.eth", async () => {
    await assertSame("/profile/ens/brantly.eth");
  });

  it("profile/ethereum.test.js /profile/ethereum/sio.eth", async () => {
    await assertSame("/profile/ethereum/sio.eth");
  });

  it("profile/farcaster.test.js /profile/farcaster/suji", async () => {
    await assertSame("/profile/farcaster/suji");
  });

  it("profile/lens.test.js /profile/lens/sujiyan.lens", async () => {
    await assertSame("/profile/lens/sujiyan.lens");
  });

  it("profile/linea.test.js /profile/linea/184.linea", async () => {
    await assertSame("/profile/linea/184.linea");
  });

  it("profile/sns.test.js /profile/sns/bonfida.sol", async () => {
    await assertSame("/profile/sns/bonfida.sol");
  });

  it("profile/solana.test.js /profile/solana/sujiyan.sol", async () => {
    await assertSame("/profile/solana/sujiyan.sol");
  });

  it("profile/ud.test.js /profile/unstoppabledomains/0x0da0ee86269797618032e56a69b1aad095c581fc", async () => {
    await assertSame(
      "/profile/unstoppabledomains/0x0da0ee86269797618032e56a69b1aad095c581fc",
    );
  });

  it("profile/universal.test.js /profile/0x7cbba07e31dc7b12bb69a1209c5b11a8ac50acf5", async () => {
    await assertSame("/profile/0x7cbba07e31dc7b12bb69a1209c5b11a8ac50acf5");
  });

  it("profile/web2.test.js /profile/web2/sujiyan.eth", async () => {
    await assertSame("/profile/web2/sujiyan.eth");
  });

  it("wallet.test.js /wallet/0xcd133d337ead9c2ac799ec7524a1e0f8aa30c3b1", async () => {
    await assertSame("/wallet/0xcd133d337ead9c2ac799ec7524a1e0f8aa30c3b1");
  });

  it("web2.test.js /ns/nostr,yuopu6", async () => {
    await assertSame("/ns/nostr,yuopu6");
  });
});
