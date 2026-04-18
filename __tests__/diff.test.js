import { queryClient } from "../utils/test-utils";

const DEFAULT_LOCAL_BASE_URL = "http://localhost:3000";
const DEFAULT_PROD_BASE_URL = "https://api.web3.bio";
const localBaseUrl = process.env.DIFF_LOCAL_BASE_URL;
const prodBaseUrl = process.env.DIFF_PROD_BASE_URL ?? DEFAULT_PROD_BASE_URL;

/** Set RUN_DIFF_TESTS=1 (see package.json test:diff) — otherwise this file is skipped so `npm test` stays fast and offline-safe. */
const runDiffSuite = process.env.RUN_DIFF_TESTS === "1";

(runDiffSuite ? describe : describe.skip)(
  "Test For Difference between prod and local",
  () => {
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

  const parseMaybeJson = (body, contentType, path, envLabel) => {
    if (!contentType?.includes("application/json")) {
      return body;
    }

    try {
      return JSON.parse(body);
    } catch (error) {
      throw new Error(
        `[${envLabel}] invalid json body path=${path} error=${error instanceof Error ? error.message : String(error)}`,
      );
    }
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
    if (path.startsWith("/domain/")) return "domain";
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

  const requestByEnv = async (path, envLabel, baseUrl) => {
    const startedAt = Date.now();
    const response = await queryClient(path, { connection: "close" }, baseUrl);

    return {
      envLabel,
      baseUrl:
        baseUrl ??
        process.env.BASE_URL ??
        (envLabel === "prod" ? DEFAULT_PROD_BASE_URL : DEFAULT_LOCAL_BASE_URL),
      response,
      elapsedMs: Date.now() - startedAt,
    };
  };

  const assertSame = async (path, compareProps) => {
    const [localRequest, prodRequest] = await Promise.all([
      requestByEnv(path, "local", localBaseUrl),
      requestByEnv(path, "prod", prodBaseUrl),
    ]);

    const localRes = localRequest.response;
    const prodRes = prodRequest.response;

    const [localBody, prodBody] = await Promise.all([
      localRes.text(),
      prodRes.text(),
    ]);

    if (localRes.status !== prodRes.status) {
      throw new Error(
        [
          `status mismatch path=${path}`,
          `local=${localRes.status} (${localRequest.baseUrl}, ${localRequest.elapsedMs}ms)`,
          `prod=${prodRes.status} (${prodRequest.baseUrl}, ${prodRequest.elapsedMs}ms)`,
        ].join(" | "),
      );
    }

    const localParsed = parseMaybeJson(
      localBody,
      localRes.headers.get("content-type") || "",
      path,
      "local",
    );
    const prodParsed = parseMaybeJson(
      prodBody,
      prodRes.headers.get("content-type") || "",
      path,
      "prod",
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

  const testCases = [
    "credential.test.js /credential/ggmonster.farcaster",
    "domain.test.js /domain/ens,sujiyan.eth",
    "ns/basenames.test.js /ns/basenames/jesse.base.eth",
    `ns/batch.test.js /ns/batch/${encodeURIComponent(JSON.stringify(nsBatchIds))}`,
    "ns/ens.test.js /ns/ens/brantly.eth",
    "ns/ethereum.test.js /ns/ethereum/luc.eth",
    "ns/farcaster.test.js /ns/farcaster/suji",
    "ns/lens.test.js /ns/lens/sujiyan.lens",
    "ns/linea.test.js /ns/linea/suji",
    "ns/sns.test.js /ns/sns/bonfida.sol",
    "ns/solana.test.js /ns/solana/bonfida.sol",
    "ns/universal.test.js /ns/sujiyan.lens",
    "profile/basenames.test.js /profile/basenames/suji.base",
    `profile/batch.test.js /profile/batch/${encodeURIComponent(JSON.stringify(profileBatchIds))}`,
    "profile/ens.test.js /profile/ens/brantly.eth",
    "profile/ens.test.js /profile/ens/0xhelena.eth",
    "profile/ens.test.js /profile/ens/pugson.eth",
    "profile/ens.test.js /profile/ens/jango.eth",
    "profile/ethereum.test.js /profile/ethereum/sio.eth",
    "profile/ethereum.test.js /profile/ethereum/komacash.eth",
    "profile/ethereum.test.js /profile/ethereum/wijuwiju.eth",
    "profile/farcaster.test.js /profile/farcaster/suji",
    "profile/lens.test.js /profile/lens/sujiyan.lens",
    "profile/linea.test.js /profile/linea/184.linea",
    "profile/sns.test.js /profile/sns/bonfida.sol",
    "profile/solana.test.js /profile/solana/sujiyan.sol",
    "profile/universal.test.js /profile/0x7cbba07e31dc7b12bb69a1209c5b11a8ac50acf5",
    "profile/universal.test.js /profile/web3.bio",
    "profile/web2.test.js /profile/web2/sujiyan.eth",
    "wallet.test.js /wallet/0xcd133d337ead9c2ac799ec7524a1e0f8aa30c3b1",
    "web2.test.js /ns/nostr,yuopu6",
  ];

  it.each(testCases)("%s", async (rawCase) => {
    const path = rawCase.slice(rawCase.indexOf(" /") + 1);
    await assertSame(path, mergeCompareProps());
  });
});
