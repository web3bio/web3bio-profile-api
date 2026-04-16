import { queryClient } from "../utils/test-utils";

const prod_base_url = "https://api.web3.bio";

describe("Test For Difference between prod and local", () => {
  jest.setTimeout(30_000);

  const nsBatchIds = [
    "ens,sujiyan.eth",
    "ens,vitalik.eth",
    "basenames,tony.base.eth",
    "farcaster,dwr.eth"
  ];

  const profileBatchIds = [
    "ens,sujiyan.eth",
    "ens,vitalik.eth",
    "tony.base.eth",
    "suji.fcast.id",
    "lens,stani.lens",
    "linea,0xthor.linea.eth",
    "184.linea",
    "farcaster,#3"
  ];

  const parseMaybeJson = (body, contentType) => {
    if (!contentType?.includes("application/json")) {
      return body;
    }

    return JSON.parse(body);
  };

  const getJsonLength = (value) => {
    if (Array.isArray(value)) return value.length;
    if (value && typeof value === "object") return Object.keys(value).length;
    return 0;
  };

  const getWalletDomainsLength = (value) => {
    const domains = value?.data?.domains ?? value?.domains;
    return Array.isArray(domains) ? domains.length : 0;
  };
  const getBatchOrderKey = (item) => {
    if (!item || typeof item !== "object") return String(item);
    if (item.identity) return `identity:${item.identity}`;
    if (item.platform && item.address) return `platform-address:${item.platform}:${item.address}`;
    if (item.platform) return `platform:${item.platform}`;
    if (item.address) return `address:${item.address}`;
    return JSON.stringify(item);
  };

  const getProfileComparableList = (value) => {
    if (Array.isArray(value)) return value;
    if (value && typeof value === "object") return [value];
    return [];
  };

  const pickProfileFields = (item) => ({
    createdAt: item?.createdAt ?? null,
    address: item?.address ?? null,
    contenthash: item?.contenthash ?? null,
    social: item?.social ?? null,
  });

  const getPlatform = (item) => item?.platform ?? "__NO_PLATFORM__";
  const getLinksCount = (item) =>
    item?.links && typeof item.links === "object" ? Object.keys(item.links).length : null;

  const assertSame = async (path) => {
    const localRes = await queryClient(path, { connection: "close" });
    const prodRes = await queryClient(path, { connection: "close" }, prod_base_url);

    const [localBody, prodBody] = await Promise.all([localRes.text(), prodRes.text()]);

    if (localRes.status !== prodRes.status) {
      throw new Error(
        `status mismatch (local=${localRes.status}, prod=${prodRes.status})`,
      );
    }

    const localParsed = parseMaybeJson(
      localBody,
      localRes.headers.get("content-type") || "",
    );
    const prodParsed = parseMaybeJson(prodBody, prodRes.headers.get("content-type") || "");

    if (path.startsWith("/credential/")) {
      if (JSON.stringify(localParsed) !== JSON.stringify(prodParsed)) {
        console.error(`[diff] credential mismatch path=${path}`);
        throw new Error(
          `credential response mismatch (local=${localRes.status}, prod=${prodRes.status})`,
        );
      }
      return;
    }

    if (path.startsWith("/wallet/")) {
      const localDomainsLength = getWalletDomainsLength(localParsed);
      const prodDomainsLength = getWalletDomainsLength(prodParsed);

      if (localDomainsLength !== prodDomainsLength) {
        console.error(
          `[diff] wallet domains length mismatch path=${path} local=${localDomainsLength} prod=${prodDomainsLength}`,
        );
        throw new Error(
          `wallet domains length mismatch (local=${localDomainsLength}, prod=${prodDomainsLength}, localStatus=${localRes.status}, prodStatus=${prodRes.status})`,
        );
      }
      return;
    }

    if (path.includes("/batch/")) {
      if (!Array.isArray(localParsed) || !Array.isArray(prodParsed)) {
        console.error(`[diff] batch response is not array path=${path}`);
        throw new Error(
          `batch response type mismatch (localStatus=${localRes.status}, prodStatus=${prodRes.status})`,
        );
      }

      if (localParsed.length !== prodParsed.length) {
        console.error(
          `[diff] batch length mismatch path=${path} local=${localParsed.length} prod=${prodParsed.length}`,
        );
        throw new Error(
          `batch length mismatch (local=${localParsed.length}, prod=${prodParsed.length}, localStatus=${localRes.status}, prodStatus=${prodRes.status})`,
        );
      }

      const localOrder = localParsed.map(getBatchOrderKey);
      const prodOrder = prodParsed.map(getBatchOrderKey);
      if (JSON.stringify(localOrder) !== JSON.stringify(prodOrder)) {
        console.error(`[diff] batch order mismatch path=${path}`);
        throw new Error(
          `batch order mismatch (localStatus=${localRes.status}, prodStatus=${prodRes.status})`,
        );
      }
      return;
    }

    if (path.startsWith("/profile/")) {
      const localList = getProfileComparableList(localParsed);
      const prodList = getProfileComparableList(prodParsed);

      if (localList.length !== prodList.length) {
        console.error(
          `[diff] profile length mismatch path=${path} local=${localList.length} prod=${prodList.length}`,
        );
        throw new Error(
          `profile length mismatch (local=${localList.length}, prod=${prodList.length}, localStatus=${localRes.status}, prodStatus=${prodRes.status})`,
        );
      }

      if (path.startsWith("/profile/web2/")) {
        const localByPlatform = new Map(
          localList.map((item) => [getPlatform(item), pickProfileFields(item)]),
        );
        const prodByPlatform = new Map(
          prodList.map((item) => [getPlatform(item), pickProfileFields(item)]),
        );

        if (localByPlatform.size !== prodByPlatform.size) {
          console.error(
            `[diff] profile/web2 platform size mismatch path=${path} local=${localByPlatform.size} prod=${prodByPlatform.size}`,
          );
          throw new Error(
            `profile/web2 platform size mismatch (local=${localByPlatform.size}, prod=${prodByPlatform.size}, localStatus=${localRes.status}, prodStatus=${prodRes.status})`,
          );
        }

        for (const [platform, localComparable] of localByPlatform.entries()) {
          if (!prodByPlatform.has(platform)) {
            console.error(
              `[diff] profile/web2 missing platform path=${path} platform=${platform}`,
            );
            throw new Error(
              `profile/web2 missing platform=${platform} (localStatus=${localRes.status}, prodStatus=${prodRes.status})`,
            );
          }

          const prodComparable = prodByPlatform.get(platform);
          if (JSON.stringify(localComparable) !== JSON.stringify(prodComparable)) {
            console.error(
              `[diff] profile/web2 fields mismatch path=${path} platform=${platform}`,
            );
            throw new Error(
              `profile/web2 fields mismatch at platform=${platform} (localStatus=${localRes.status}, prodStatus=${prodRes.status})`,
            );
          }

          const localLinksCount = getLinksCount(
            localList.find((item) => getPlatform(item) === platform),
          );
          const prodLinksCount = getLinksCount(
            prodList.find((item) => getPlatform(item) === platform),
          );
          if (localLinksCount !== prodLinksCount) {
            console.error(
              `[diff] profile/web2 links count mismatch path=${path} platform=${platform} local=${localLinksCount} prod=${prodLinksCount}`,
            );
            throw new Error(
              `profile/web2 links count mismatch at platform=${platform} (local=${localLinksCount}, prod=${prodLinksCount}, localStatus=${localRes.status}, prodStatus=${prodRes.status})`,
            );
          }
        }
        return;
      }

      for (let i = 0; i < localList.length; i += 1) {
        const localComparable = pickProfileFields(localList[i]);
        const prodComparable = pickProfileFields(prodList[i]);

        if (JSON.stringify(localComparable) !== JSON.stringify(prodComparable)) {
          console.error(`[diff] profile fields mismatch path=${path} index=${i}`);
          throw new Error(
            `profile fields mismatch at index=${i} (localStatus=${localRes.status}, prodStatus=${prodRes.status})`,
          );
        }

        const localLinksCount = getLinksCount(localList[i]);
        const prodLinksCount = getLinksCount(prodList[i]);
        if (localLinksCount !== prodLinksCount) {
          console.error(
            `[diff] profile links count mismatch path=${path} index=${i} local=${localLinksCount} prod=${prodLinksCount}`,
          );
          throw new Error(
            `profile links count mismatch at index=${i} (local=${localLinksCount}, prod=${prodLinksCount}, localStatus=${localRes.status}, prodStatus=${prodRes.status})`,
          );
        }
      }
      return;
    }

    if (path.startsWith("/ns/")) {
      const localLength = getJsonLength(localParsed);
      const prodLength = getJsonLength(prodParsed);

      if (localLength !== prodLength) {
        console.error(
          `[diff] ns length mismatch path=${path} local=${localLength} prod=${prodLength}`,
        );
        throw new Error(
          `json length mismatch (local=${localLength}, prod=${prodLength}, localStatus=${localRes.status}, prodStatus=${prodRes.status})`,
        );
      }
    }
  };

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
