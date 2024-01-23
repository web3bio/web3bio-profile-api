import type { NextApiRequest } from "next";
import {
  errorHandle,
  ErrorMessages,
  formatText,
  isValidEthereumAddress,
  respondWithCache,
} from "@/utils/base";
import {
  getSocialMediaLink,
  resolveEipAssetURL,
  resolveHandle,
} from "@/utils/resolver";
import { PlatformType, PlatformData } from "@/utils/platform";
import { regexEns, regexEth } from "@/utils/regexp";
import { createPublicClient, http } from "viem";
import { mainnet } from "viem/chains";

const client = createPublicClient({
  chain: mainnet,
  transport: http(process.env.NEXT_PUBLIC_ETHEREUM_RPC_URL),
}) as any;
const ensSubGraphBaseURL =
  "https://api.thegraph.com/subgraphs/name/ensdomains/ens";

const commonQueryOptions = {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
};

const ensRecordsDefaultOrShouldSkipText = [
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
];

const getENSRecordsQuery = `
  query Profile($name: String) {
    domains(where: { name: $name }) {
      resolver {
        texts
        coinTypes
      }
    }
  }
`;

export const resolveENSTextValue = async (name: string, text: string) => {
  return await client.getEnsText({
    name: name,
    key: text,
  });
};

export const resolveENSResponse = async (handle: string) => {
  let address = "";
  let ensDomain = "";
  let resolver = null;
  if (isValidEthereumAddress(handle)) {
    if (!isValidEthereumAddress(handle))
      throw new Error(ErrorMessages.invalidAddr, { cause: 404 });
    address = handle.toLowerCase();
    ensDomain =
      (await client.getEnsName({
        address,
      })) || "";

    resolver = (await getENSProfile(ensDomain))?.[0];
    if (!ensDomain) {
      return {
        address,
        earlyReturnJSON: {
          address: address,
          identity: address,
          platform: PlatformType.ethereum,
          displayName: formatText(address),
          avatar: null,
          description: null,
          email: null,
          location: null,
          header: null,
          links: null,
        },
      };
    }
  } else {
    if (!regexEns.test(handle))
      throw Error(ErrorMessages.invalidIdentity, { cause: 404 });
    ensDomain = handle;
    try {
      address = await client
        .getEnsAddress({
          name: ensDomain,
        })
        .then((res: string) => res);
    } catch (e) {
      console.log("error", e);
    }

    if (!isValidEthereumAddress(address) || !address)
      throw new Error(ErrorMessages.invalidResolved, { cause: 404 });

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
  };
};

export const resolveENSHandle = async (handle: string) => {
  const { address, ensDomain, earlyReturnJSON, textRecords } =
    await resolveENSResponse(handle);
  if (earlyReturnJSON) {
    return earlyReturnJSON;
  }
  let LINKRES = {};
  if (textRecords?.length > 0) {
    const linksToFetch = textRecords.reduce(
      (pre: Array<string>, cur: string) => {
        if (!ensRecordsDefaultOrShouldSkipText.includes(cur)) pre.push(cur);
        return pre;
      },
      []
    );

    const getLink = async () => {
      const _linkRes: { [index: string]: any } = {};
      for (let i = 0; i < linksToFetch.length; i++) {
        const recordText = linksToFetch[i];
        const key =
          Object.values(PlatformData).find((o) =>
            o.ensText?.includes(recordText.toLowerCase())
          )?.key || recordText;
        const textValue = await resolveENSTextValue(ensDomain, recordText);
        const handle = resolveHandle(textValue, key as PlatformType);

        if (textValue && handle) {
          const resolvedKey =
            key === PlatformType.url ? PlatformType.website : key;
          _linkRes[resolvedKey] = {
            link: getSocialMediaLink(handle, resolvedKey),
            handle: handle,
          };
        }
      }
      return _linkRes;
    };
    LINKRES = await getLink();
  }

  const headerHandle = (await resolveENSTextValue(ensDomain, "header")) || null;
  const avatarHandle = (await resolveENSTextValue(ensDomain, "avatar")) || null;
  const resJSON = {
    address: address.toLowerCase(),
    identity: ensDomain,
    platform: PlatformType.ens,
    displayName: (await resolveENSTextValue(ensDomain, "name")) || ensDomain,
    avatar: avatarHandle ? await resolveEipAssetURL(avatarHandle) : null,
    description: (await resolveENSTextValue(ensDomain, "description")) || null,
    email: (await resolveENSTextValue(ensDomain, "email")) || null,
    location: (await resolveENSTextValue(ensDomain, "location")) || null,
    header: (await resolveEipAssetURL(headerHandle)) || null,
    links: LINKRES,
  };
  return resJSON;
};

export const getENSProfile = async (name: string) => {
  try {
    const payload = {
      query: getENSRecordsQuery,
      variables: {
        name,
      },
    };
    const fetchRes = await fetch(ensSubGraphBaseURL, {
      ...commonQueryOptions,
      body: JSON.stringify(payload),
    }).then((res) => res.json());

    if (fetchRes) return fetchRes.data?.domains || fetchRes.errors;
  } catch (e) {
    return null;
  }
};

export const resolveENSRespond = async (handle: string) => {
  try {
    const json = await resolveENSHandle(handle);
    return respondWithCache(JSON.stringify(json));
  } catch (e: any) {
    return errorHandle({
      identity: handle,
      platform: PlatformType.ens,
      code: e.cause || 500,
      message: e.message,
    });
  }
};

export default async function handler(req: NextApiRequest) {
  const { searchParams } = new URL(req.url as string);
  const inputName = searchParams.get("handle") || "";
  const lowercaseName = inputName?.toLowerCase();

  if (!regexEns.test(lowercaseName) && !regexEth.test(lowercaseName))
    return errorHandle({
      identity: lowercaseName,
      platform: PlatformType.ens,
      code: 404,
      message: ErrorMessages.invalidIdentity,
    });
  return resolveENSRespond(lowercaseName);
}

export const config = {
  runtime: "edge",
  regions: ["sfo1", "iad1", "pdx1"],
  maxDuration: 45,
};
