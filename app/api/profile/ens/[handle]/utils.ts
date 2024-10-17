import { formatText, isValidEthereumAddress } from "@/utils/base";
import {
  decodeContenthash,
  getSocialMediaLink,
  resolveEipAssetURL,
  resolveHandle,
} from "@/utils/resolver";
import { PLATFORM_DATA, PlatformType } from "@/utils/platform";
import { regexEns } from "@/utils/regexp";
import { createPublicClient, http } from "viem";
import { mainnet } from "viem/chains";
import { ErrorMessages } from "@/utils/types";

const client = createPublicClient({
  chain: mainnet,
  transport: http(process.env.NEXT_PUBLIC_ETHEREUM_RPC_URL),
});

const theGraphKey = process.env.NEXT_PUBLIC_THEGRAPH_API_KEY;
const ensSubGraphBaseURL = theGraphKey
  ? `https://gateway-arbitrum.network.thegraph.com/api/${theGraphKey}/subgraphs/id/5XqPmWe6gjyrJtFn9cLy237i4cWw2j9HcUJEXsP5qGtH`
  : "https://api.thegraph.com/subgraphs/name/ensdomains/ens";

const commonQueryOptions = {
  method: "POST",
  headers: { "Content-Type": "application/json" },
};

export const ensRecordsDefaultOrShouldSkipText = new Set([
  "name",
  "email",
  "snapshot",
  "avatar",
  "header",
  "description",
  "eth.ens.delegate",
  "notice",
  "keywords",
  "location",
  "banner",
]);

const getENSRecordsQuery = `
  query Profile($name: String) {
    domains(where: { name: $name }) {
      resolver {
        texts
        coinTypes
        contentHash
      }
    }
  }
`;

export const resolveENSTextValue = async (name: string, text: string) => {
  return await client.getEnsText({ name, key: text });
};

const getHeaderTextValue = async (texts: string, domain: string) => {
  if (!texts?.length) return null;
  const headerKey = texts.includes("header")
    ? "header"
    : texts.includes("banner")
    ? "banner"
    : null;
  return headerKey ? resolveENSTextValue(domain, headerKey) : null;
};

export const resolveENSResponse = async (handle: string) => {
  let address = "";
  let ensDomain = "";
  let resolver = null;

  if (isValidEthereumAddress(handle)) {
    address = handle.toLowerCase();
    ensDomain =
      (await client.getEnsName({ address: address as `0x${string}` })) || "";
    resolver = ensDomain ? (await getENSProfile(ensDomain))?.[0] : null;

    if (!ensDomain) {
      return {
        address,
        earlyReturnJSON: {
          address,
          identity: address,
          platform: PlatformType.ethereum,
          displayName: formatText(address),
          avatar: null,
          description: null,
          email: null,
          location: null,
          header: null,
          contenthash: null,
          links: {},
        },
      };
    }
  } else {
    if (!regexEns.test(handle))
      throw new Error(ErrorMessages.invalidIdentity, { cause: 404 });
    ensDomain = handle;
    try {
      address = (await client.getEnsAddress({ name: ensDomain })) || "";
    } catch (e) {
      console.error("Error resolving ENS address:", e);
    }

    if (!address || !isValidEthereumAddress(address)) {
      throw new Error(ErrorMessages.invalidResolved, { cause: 404 });
    }

    resolver = (await getENSProfile(ensDomain))?.[0];
    if (!resolver?.resolver && !address)
      throw new Error(ErrorMessages.invalidResolver, { cause: 404 });
    if (resolver?.message) throw new Error(resolver.message);
  }

  return {
    address,
    ensDomain,
    earlyReturnJSON: null,
    textRecords: resolver?.resolver?.texts,
    contentHash: resolver?.resolver?.contentHash,
  };
};

export const resolveENSHandle = async (handle: string) => {
  const { address, ensDomain, earlyReturnJSON, textRecords, contentHash } =
    await resolveENSResponse(handle);
  if (earlyReturnJSON) return earlyReturnJSON;

  const linksObj = await getLinks(textRecords, ensDomain);
  const headerHandle = (await getHeaderTextValue(textRecords, ensDomain)) || "";
  const avatarHandle = await resolveENSTextValue(ensDomain, "avatar");

  return {
    address: address.toLowerCase(),
    identity: ensDomain,
    platform: PlatformType.ens,
    displayName: (await resolveENSTextValue(ensDomain, "name")) || ensDomain,
    avatar: avatarHandle ? await resolveEipAssetURL(avatarHandle) : null,
    description: (await resolveENSTextValue(ensDomain, "description")) || null,
    email: (await resolveENSTextValue(ensDomain, "email")) || null,
    location: (await resolveENSTextValue(ensDomain, "location")) || null,
    header: (await resolveEipAssetURL(headerHandle)) || null,
    contenthash: decodeContenthash(contentHash),
    links: linksObj,
    social: {},
  };
};

const getLinks = async (textRecords: string[], ensDomain: string) => {
  if (!textRecords?.length) return {};

  const linksToFetch = textRecords.filter(
    (text) => !ensRecordsDefaultOrShouldSkipText.has(text)
  );
  const linkPromises = linksToFetch.map(async (recordText) => {
    const key = Array.from(PLATFORM_DATA.keys()).find((k) =>
      PLATFORM_DATA.get(k)?.ensText?.includes(recordText.toLowerCase())
    );
    if (!key) return null;

    const textValue = (await resolveENSTextValue(ensDomain, recordText)) || "";
    const handle = resolveHandle(textValue, key);
    if (!textValue || !handle) return null;

    const resolvedKey = key === PlatformType.url ? PlatformType.website : key;
    return [
      resolvedKey,
      {
        link: getSocialMediaLink(handle, resolvedKey),
        handle,
      },
    ];
  });

  const resolvedLinks = await Promise.all(linkPromises);
  return Object.fromEntries(resolvedLinks.filter(Boolean) as any);
};

export const getENSProfile = async (name: string) => {
  try {
    const payload = { query: getENSRecordsQuery, variables: { name } };
    const response = await fetch(ensSubGraphBaseURL, {
      ...commonQueryOptions,
      body: JSON.stringify(payload),
    });
    const fetchRes = await response.json();
    return fetchRes.data?.domains || fetchRes.errors;
  } catch (e) {
    console.error("Error fetching ENS profile:", e);
    return null;
  }
};
