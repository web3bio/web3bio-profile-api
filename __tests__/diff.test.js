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

  const getArrayOrderKey = (item) => {
    if (!item || typeof item !== "object") return String(item);
    const platform = item.platform ?? "__NO_PLATFORM__";
    const identity = item.identity ?? "__NO_IDENTITY__";
    return `${platform}:${identity}`;
  };

  const getJsonType = (value) => {
    if (Array.isArray(value)) return "array";
    if (value && typeof value === "object") return "object";
    return "primitive";
  };

  const compareJsonLengthAndOrder = (
    path,
    localParsed,
    prodParsed,
    localRes,
    prodRes,
  ) => {
    const localType = getJsonType(localParsed);
    const prodType = getJsonType(prodParsed);

    if (localType !== prodType) {
      console.error(
        `[diff] json type mismatch path=${path} localType=${localType} prodType=${prodType}`,
      );
      throw new Error(
        `json type mismatch (localType=${localType}, prodType=${prodType}, localStatus=${localRes.status}, prodStatus=${prodRes.status})`,
      );
    }

    if (localType === "array") {
      if (localParsed.length !== prodParsed.length) {
        console.error(
          `[diff] array length mismatch path=${path} local=${localParsed.length} prod=${prodParsed.length}`,
        );
        throw new Error(
          `array length mismatch (local=${localParsed.length}, prod=${prodParsed.length}, localStatus=${localRes.status}, prodStatus=${prodRes.status})`,
        );
      }

      const localOrder = localParsed.map(getArrayOrderKey);
      const prodOrder = prodParsed.map(getArrayOrderKey);
      if (JSON.stringify(localOrder) !== JSON.stringify(prodOrder)) {
        console.error(`[diff] array order mismatch path=${path}`);
        throw new Error(
          `array order mismatch (localStatus=${localRes.status}, prodStatus=${prodRes.status})`,
        );
      }
      return;
    }

    if (localType === "object") {
      const localLength = Object.keys(localParsed).length;
      const prodLength = Object.keys(prodParsed).length;
      if (localLength !== prodLength) {
        console.error(
          `[diff] object length mismatch path=${path} local=${localLength} prod=${prodLength}`,
        );
        throw new Error(
          `object length mismatch (local=${localLength}, prod=${prodLength}, localStatus=${localRes.status}, prodStatus=${prodRes.status})`,
        );
      }
    }
  };

  const getValueByPath = (item, path) =>
    path.split(".").reduce((current, segment) => {
      if (current == null) return null;
      return current[segment] ?? null;
    }, item);

  const buildComparableByPaths = (item, fields) =>
    fields.reduce((acc, fieldPath) => {
      acc[fieldPath] = getValueByPath(item, fieldPath);
      return acc;
    }, {});
  const getIdentityLabel = (item) => item?.identity ?? getArrayOrderKey(item);
  const getFirstMismatchedField = (localComparable, prodComparable, fields) =>
    fields.find(
      (field) =>
        JSON.stringify(localComparable[field]) !== JSON.stringify(prodComparable[field]),
    ) ?? "__UNKNOWN_FIELD__";
  const getFirstArrayMismatch = (localArray, prodArray) => {
    const maxLen = Math.max(localArray.length, prodArray.length);
    for (let i = 0; i < maxLen; i += 1) {
      if (JSON.stringify(localArray[i]) !== JSON.stringify(prodArray[i])) {
        return { index: i, local: localArray[i], prod: prodArray[i] };
      }
    }
    return null;
  };

  const getPlatform = (item) => item?.platform ?? "__NO_PLATFORM__";
  const toComparableList = (value) => {
    if (Array.isArray(value)) return value;
    if (value && typeof value === "object") return [value];
    return [];
  };
  const getObjectKeysInOrder = (value) => {
    if (!value || typeof value !== "object" || Array.isArray(value)) return [];
    return Object.keys(value);
  };
  const getWalletDomains = (value) => {
    const domains = value?.data?.domains ?? value?.domains;
    return Array.isArray(domains) ? domains : [];
  };

  const DEFAULT_COMPARE_PROPS = {
    credential: {
      exactJson: true,
    },
    wallet: {
      fields: ["address"],
      checkDomainsCount: true,
      checkDomainsOrder: false,
    },
    web2: {
      checkJsonCount: true,
      checkJsonOrder: true,
    },
    ns: {
      fields: ["identity", "address", "createdAt", "avatar"],
    },
    profile: {
      fields: ["identity", "address", "createdAt", "avatar"],
      byIdentityFields: {},
      checkLinksKeysCount: true,
      checkLinksKeysOrder: true,
    },
  };

  const mergeCompareProps = (overrideProps = {}) => ({
    credential: {
      ...DEFAULT_COMPARE_PROPS.credential,
      ...(overrideProps.credential ?? {}),
    },
    wallet: {
      ...DEFAULT_COMPARE_PROPS.wallet,
      ...(overrideProps.wallet ?? {}),
    },
    web2: {
      ...DEFAULT_COMPARE_PROPS.web2,
      ...(overrideProps.web2 ?? {}),
    },
    ns: {
      ...DEFAULT_COMPARE_PROPS.ns,
      ...(overrideProps.ns ?? {}),
    },
    profile: {
      ...DEFAULT_COMPARE_PROPS.profile,
      ...(overrideProps.profile ?? {}),
      byIdentityFields: {
        ...DEFAULT_COMPARE_PROPS.profile.byIdentityFields,
        ...(overrideProps.profile?.byIdentityFields ?? {}),
      },
    },
  });

  const getEndpointKey = (path) => {
    if (path.startsWith("/credential/")) return "credential";
    if (path.startsWith("/profile/web2/")) return "web2";
    if (path.startsWith("/wallet/")) return "wallet";
    if (path.startsWith("/profile/")) return "profile";
    if (path.startsWith("/ns/")) return "ns";
    return "unknown";
  };

  const compareByConfiguredProps = (
    path,
    localParsed,
    prodParsed,
    localRes,
    prodRes,
    compareProps,
  ) => {
    const endpointKey = getEndpointKey(path);

    if (endpointKey === "credential" && compareProps.credential.exactJson) {
      if (JSON.stringify(localParsed) !== JSON.stringify(prodParsed)) {
        console.error(`[diff] credential mismatch path=${path}`);
        throw new Error(
          `credential response mismatch (local=${localRes.status}, prod=${prodRes.status})`,
        );
      }
      return;
    }

    if (endpointKey === "web2") {
      if (compareProps.web2.checkJsonCount) {
        const localLength = getJsonLength(localParsed);
        const prodLength = getJsonLength(prodParsed);
        if (localLength !== prodLength) {
          console.error(
            `[diff] web2 json count mismatch path=${path} local=${localLength} prod=${prodLength}`,
          );
          throw new Error(
            `web2 json count mismatch (local=${localLength}, prod=${prodLength}, localStatus=${localRes.status}, prodStatus=${prodRes.status})`,
          );
        }
      }
      if (
        compareProps.web2.checkJsonOrder &&
        Array.isArray(localParsed) &&
        Array.isArray(prodParsed)
      ) {
        const localOrder = localParsed.map(getArrayOrderKey);
        const prodOrder = prodParsed.map(getArrayOrderKey);
        if (JSON.stringify(localOrder) !== JSON.stringify(prodOrder)) {
          const mismatch = getFirstArrayMismatch(localOrder, prodOrder);
          console.error(
            `[diff] web2 json order mismatch path=${path} index=${mismatch?.index} local=${mismatch?.local} prod=${mismatch?.prod}`,
          );
          throw new Error(
            `web2 json order mismatch (localStatus=${localRes.status}, prodStatus=${prodRes.status})`,
          );
        }
      }
      return;
    }

    if (endpointKey === "wallet") {
      const localComparable = buildComparableByPaths(localParsed, compareProps.wallet.fields);
      const prodComparable = buildComparableByPaths(prodParsed, compareProps.wallet.fields);
      if (JSON.stringify(localComparable) !== JSON.stringify(prodComparable)) {
        const mismatchField = getFirstMismatchedField(
          localComparable,
          prodComparable,
          compareProps.wallet.fields,
        );
        console.error(
          `[diff] wallet field mismatch path=${path} key=${mismatchField} local=${JSON.stringify(localComparable[mismatchField])} prod=${JSON.stringify(prodComparable[mismatchField])}`,
        );
        throw new Error(
          `wallet fields mismatch (localStatus=${localRes.status}, prodStatus=${prodRes.status})`,
        );
      }

      const localDomains = getWalletDomains(localParsed);
      const prodDomains = getWalletDomains(prodParsed);
      if (compareProps.wallet.checkDomainsCount && localDomains.length !== prodDomains.length) {
        console.error(
          `[diff] wallet domains count mismatch path=${path} local=${localDomains.length} prod=${prodDomains.length}`,
        );
        throw new Error(
          `wallet domains count mismatch (local=${localDomains.length}, prod=${prodDomains.length}, localStatus=${localRes.status}, prodStatus=${prodRes.status})`,
        );
      }
      if (compareProps.wallet.checkDomainsOrder) {
        if (JSON.stringify(localDomains) !== JSON.stringify(prodDomains)) {
          const mismatch = getFirstArrayMismatch(localDomains, prodDomains);
          console.error(
            `[diff] wallet domains order mismatch path=${path} index=${mismatch?.index} local=${JSON.stringify(mismatch?.local)} prod=${JSON.stringify(mismatch?.prod)}`,
          );
          throw new Error(
            `wallet domains order mismatch (localStatus=${localRes.status}, prodStatus=${prodRes.status})`,
          );
        }
      }
      return;
    }

    if (endpointKey === "profile") {
      const localList = toComparableList(localParsed);
      const prodList = toComparableList(prodParsed);

      if (localList.length !== prodList.length) {
        console.error(
          `[diff] profile length mismatch path=${path} local=${localList.length} prod=${prodList.length}`,
        );
        throw new Error(
          `profile length mismatch (local=${localList.length}, prod=${prodList.length}, localStatus=${localRes.status}, prodStatus=${prodRes.status})`,
        );
      }

      for (let i = 0; i < localList.length; i += 1) {
        const localOrderKey = getArrayOrderKey(localList[i]);
        const prodOrderKey = getArrayOrderKey(prodList[i]);

        const localFields =
          compareProps.profile.byIdentityFields[localOrderKey] ??
          compareProps.profile.fields;
        const prodFields =
          compareProps.profile.byIdentityFields[prodOrderKey] ??
          compareProps.profile.fields;
        const fields =
          localFields.length >= prodFields.length ? localFields : prodFields;

        const localComparable = buildComparableByPaths(localList[i], fields);
        const prodComparable = buildComparableByPaths(prodList[i], fields);

        if (
          JSON.stringify(localComparable) !== JSON.stringify(prodComparable)
        ) {
          const identity = getIdentityLabel(localList[i]);
          const mismatchField = getFirstMismatchedField(
            localComparable,
            prodComparable,
            fields,
          );
          console.error(
            `[diff] profile field mismatch path=${path} identity=${identity} key=${mismatchField} local=${JSON.stringify(localComparable[mismatchField])} prod=${JSON.stringify(prodComparable[mismatchField])}`,
          );
          throw new Error(
            `profile fields mismatch path=${path} key=${mismatchField} (localStatus=${localRes.status}, prodStatus=${prodRes.status})`,
          );
        }

        const localLinksKeys = getObjectKeysInOrder(localList[i]?.links);
        const prodLinksKeys = getObjectKeysInOrder(prodList[i]?.links);

        if (
          compareProps.profile.checkLinksKeysCount &&
          localLinksKeys.length !== prodLinksKeys.length
        ) {
          console.error(
            `[diff] profile links keys count mismatch path=${path} index=${i} local=${localLinksKeys.length} prod=${prodLinksKeys.length}`,
          );
          throw new Error(
            `profile links keys count mismatch at index=${i} (local=${localLinksKeys.length}, prod=${prodLinksKeys.length}, localStatus=${localRes.status}, prodStatus=${prodRes.status})`,
          );
        }

        if (
          compareProps.profile.checkLinksKeysOrder &&
          JSON.stringify(localLinksKeys) !== JSON.stringify(prodLinksKeys)
        ) {
          const identity = getIdentityLabel(localList[i]);
          const mismatch = getFirstArrayMismatch(localLinksKeys, prodLinksKeys);
          console.error(
            `[diff] profile links keys order mismatch path=${path} identity=${identity} index=${mismatch?.index} local=${mismatch?.local} prod=${mismatch?.prod}`,
          );
          throw new Error(
            `profile links keys order mismatch at index=${i} (localStatus=${localRes.status}, prodStatus=${prodRes.status})`,
          );
        }
      }
      return;
    }

    if (endpointKey === "ns") {
      const localList = toComparableList(localParsed);
      const prodList = toComparableList(prodParsed);
      if (localList.length !== prodList.length) {
        console.error(
          `[diff] ns length mismatch path=${path} local=${localList.length} prod=${prodList.length}`,
        );
        throw new Error(
          `ns length mismatch (local=${localList.length}, prod=${prodList.length}, localStatus=${localRes.status}, prodStatus=${prodRes.status})`,
        );
      }

      for (let i = 0; i < localList.length; i += 1) {
        const localComparable = buildComparableByPaths(localList[i], compareProps.ns.fields);
        const prodComparable = buildComparableByPaths(prodList[i], compareProps.ns.fields);
        if (JSON.stringify(localComparable) !== JSON.stringify(prodComparable)) {
          const identity = getIdentityLabel(localList[i]);
          const mismatchField = getFirstMismatchedField(
            localComparable,
            prodComparable,
            compareProps.ns.fields,
          );
          console.error(
            `[diff] ns field mismatch path=${path} identity=${identity} key=${mismatchField} local=${JSON.stringify(localComparable[mismatchField])} prod=${JSON.stringify(prodComparable[mismatchField])}`,
          );
          throw new Error(
            `ns fields mismatch at index=${i} (localStatus=${localRes.status}, prodStatus=${prodRes.status})`,
          );
        }
      }
      return;
    }
  };

  const assertSame = async (path, compareProps) => {
    const localRes = await queryClient(path, { connection: "close" });
    const prodRes = await queryClient(
      path,
      { connection: "close" },
      prod_base_url,
    );

    const [localBody, prodBody] = await Promise.all([
      localRes.text(),
      prodRes.text(),
    ]);

    if (localRes.status !== prodRes.status) {
      throw new Error(
        `status mismatch (local=${localRes.status}, prod=${prodRes.status})`,
      );
    }

    const localParsed = parseMaybeJson(
      localBody,
      localRes.headers.get("content-type") || "",
    );
    const prodParsed = parseMaybeJson(
      prodBody,
      prodRes.headers.get("content-type") || "",
    );

    compareJsonLengthAndOrder(path, localParsed, prodParsed, localRes, prodRes);
    compareByConfiguredProps(
      path,
      localParsed,
      prodParsed,
      localRes,
      prodRes,
      compareProps,
    );
  };

  it("credential.test.js /credential/ggmonster.farcaster", async () => {
    await assertSame("/credential/ggmonster.farcaster", mergeCompareProps());
  });

  it("domain.test.js /domain/ens,sujiyan.eth", async () => {
    await assertSame("/domain/ens,sujiyan.eth", mergeCompareProps());
  });

  it("ns/basenames.test.js /ns/basenames/jesse.base.eth", async () => {
    await assertSame("/ns/basenames/jesse.base.eth", mergeCompareProps());
  });

  it("ns/batch.test.js /ns/batch", async () => {
    await assertSame(
      `/ns/batch/${encodeURIComponent(JSON.stringify(nsBatchIds))}`,
      mergeCompareProps(),
    );
  });

  it("ns/ens.test.js /ns/ens/brantly.eth", async () => {
    await assertSame("/ns/ens/brantly.eth", mergeCompareProps());
  });

  it("ns/ethereum.test.js /ns/ethereum/luc.eth", async () => {
    await assertSame("/ns/ethereum/luc.eth", mergeCompareProps());
  });

  it("ns/farcaster.test.js /ns/farcaster/suji", async () => {
    await assertSame("/ns/farcaster/suji", mergeCompareProps());
  });

  it("ns/lens.test.js /ns/lens/sujiyan.lens", async () => {
    await assertSame("/ns/lens/sujiyan.lens", mergeCompareProps());
  });

  it("ns/linea.test.js /ns/linea/suji", async () => {
    await assertSame("/ns/linea/suji", mergeCompareProps());
  });

  it("ns/sns.test.js /ns/sns/bonfida.sol", async () => {
    await assertSame("/ns/sns/bonfida.sol", mergeCompareProps());
  });

  it("ns/solana.test.js /ns/solana/bonfida.sol", async () => {
    await assertSame("/ns/solana/bonfida.sol", mergeCompareProps());
  });

  it("ns/ud.test.js /ns/unstoppabledomains/sandy.x", async () => {
    await assertSame("/ns/unstoppabledomains/sandy.x", mergeCompareProps());
  });

  it("ns/universal.test.js /ns/sujiyan.lens", async () => {
    await assertSame("/ns/sujiyan.lens", mergeCompareProps());
  });

  it("profile/basenames.test.js /profile/basenames/suji.base", async () => {
    await assertSame("/profile/basenames/suji.base", mergeCompareProps());
  });

  it("profile/batch.test.js /profile/batch", async () => {
    await assertSame(
      `/profile/batch/${encodeURIComponent(JSON.stringify(profileBatchIds))}`,
      mergeCompareProps(),
    );
  });

  it("profile/ens.test.js /profile/ens/brantly.eth", async () => {
    await assertSame("/profile/ens/brantly.eth", mergeCompareProps());
  });

  it("profile/ethereum.test.js /profile/ethereum/sio.eth", async () => {
    await assertSame("/profile/ethereum/sio.eth", mergeCompareProps());
  });
  it("profile/ethereum.test.js /profile/ens/komacash.eth", async () => {
    await assertSame("/profile/ethereum/komacash.eth", mergeCompareProps());
  });
  it("profile/ethereum.test.js /profile/ens/wijuwiju.eth", async () => {
    await assertSame("/profile/ethereum/wijuwiju.eth", mergeCompareProps());
  });

  it("profile/farcaster.test.js /profile/farcaster/suji", async () => {
    await assertSame("/profile/farcaster/suji", mergeCompareProps());
  });

  it("profile/lens.test.js /profile/lens/sujiyan.lens", async () => {
    await assertSame("/profile/lens/sujiyan.lens", mergeCompareProps());
  });

  it("profile/linea.test.js /profile/linea/184.linea", async () => {
    await assertSame("/profile/linea/184.linea", mergeCompareProps());
  });

  it("profile/sns.test.js /profile/sns/bonfida.sol", async () => {
    await assertSame("/profile/sns/bonfida.sol", mergeCompareProps());
  });

  it("profile/solana.test.js /profile/solana/sujiyan.sol", async () => {
    await assertSame("/profile/solana/sujiyan.sol", mergeCompareProps());
  });

  it("profile/ud.test.js /profile/unstoppabledomains/0x0da0ee86269797618032e56a69b1aad095c581fc", async () => {
    await assertSame(
      "/profile/unstoppabledomains/0x0da0ee86269797618032e56a69b1aad095c581fc",
      mergeCompareProps(),
    );
  });

  it("profile/universal.test.js /profile/0x7cbba07e31dc7b12bb69a1209c5b11a8ac50acf5", async () => {
    await assertSame(
      "/profile/0x7cbba07e31dc7b12bb69a1209c5b11a8ac50acf5",
      mergeCompareProps(),
    );
  });
  it("profile/universal.test.js /profile/web3.bio", async () => {
    await assertSame("/profile/web3.bio", mergeCompareProps());
  });

  it("profile/web2.test.js /profile/web2/sujiyan.eth", async () => {
    await assertSame("/profile/web2/sujiyan.eth", mergeCompareProps());
  });

  it("wallet.test.js /wallet/0xcd133d337ead9c2ac799ec7524a1e0f8aa30c3b1", async () => {
    await assertSame(
      "/wallet/0xcd133d337ead9c2ac799ec7524a1e0f8aa30c3b1",
      mergeCompareProps(),
    );
  });

  it("web2.test.js /ns/nostr,yuopu6", async () => {
    await assertSame("/ns/nostr,yuopu6", mergeCompareProps());
  });
});
