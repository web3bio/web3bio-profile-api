import type { NextApiRequest } from "next";
import { getAddress, isAddress } from "@ethersproject/address";
import {
  errorHandle,
  ErrorMessages,
  formatText,
  respondWithCache,
} from "@/utils/base";
import {
  getSocialMediaLink,
  resolveEipAssetURL,
  resolveHandle,
} from "@/utils/resolver";
import _ from "lodash";
import { PlatformType, PlatformData } from "@/utils/platform";
import { CoinType } from "@/utils/cointype";
import { regexEns, regexEth } from "@/utils/regexp";
import { ethers } from "ethers";
import { base, resolverABI } from "../../../../utils/resolverABI";
import { formatsByCoinType } from "@ensdomains/address-encoder";

const ENSRegistryAddress = "0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e";
const ENSReverseRecordsAddress = "0x3671aE578E63FdF66ad4F3E12CC0c0d71Ac7510C";

const iface = new ethers.utils.Interface(base);
const resolverFace = new ethers.utils.Interface(resolverABI);

export const isValidEthereumAddress = (address: string) => {
  if (!isAddress(address)) return false; // invalid ethereum address
  if (address.match(/^0x0*.$|0x[123468abef]*$|0x0*dead$/i)) return false; // empty & burn address
  return true;
};

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

const ethereumRPCURL =
  process.env.NEXT_PUBLIC_ETHEREUM_RPC_URL || "https://rpc.ankr.com/eth	";

export const resolveAddressFromName = async (name: string) => {
  if (!name) return null;
  const res = await getENSProfile(name);
  return res?.[0];
};

const fetchEthereumRPC = async ({
  data,
  to,
  decodeType,
}: {
  data: string;
  to: string;
  decodeType: string;
}) => {
  try {
    const resp = await fetch(ethereumRPCURL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: "1",
        method: "eth_call",
        params: [{ to, data }, "latest"],
      }),
    });
    const res = await resp.text();

    const rr = ethers.utils.defaultAbiCoder.decode(
      [ethers.utils.ParamType.from(decodeType)],
      JSON.parse(res)?.result
    );
    return rr[0];
  } catch (e) {
    return null;
  }
};
export const getResolverAddressFromName = async (name: string) => {
  const node = ethers.utils.namehash(name);
  const data = iface.encodeFunctionData("resolver", [node]);
  const res = await fetchEthereumRPC({
    data: data,
    to: ENSRegistryAddress,
    decodeType: "address",
  });
  return res?.toLowerCase();
};

export const resolveNameFromAddress = async (address: string) => {
  const data = iface.encodeFunctionData("getNames", [[address.substring(2)]]);
  return (
    await fetchEthereumRPC({
      data: data,
      to: ENSReverseRecordsAddress,
      decodeType: "string[]",
    })
  )?.[0].toLowerCase();
};

export const resolveENSTextValue = async (
  resolverAddress: string,
  name: string,
  text: string
) => {
  const nodeHash = ethers.utils.namehash(name);
  const data = resolverFace.encodeFunctionData("text", [nodeHash, text]);
  return await fetchEthereumRPC({
    data: data,
    to: resolverAddress,
    decodeType: "string",
  });
};

export const resolveENSCoinTypesValue = async (
  resolverAddress: string,
  name: string,
  coinType: string | number
) => {
  if (!resolverAddress) return null;
  const nodeHash = ethers.utils.namehash(name);
  const { encoder } = formatsByCoinType[coinType];
  const data = resolverFace.encodeFunctionData("addr", [nodeHash, coinType]);
  const rr = await fetchEthereumRPC({
    data: data,
    to: resolverAddress,
    decodeType: "bytes",
  });
  if (!rr || rr === "0x") return null;

  return encoder(Buffer.from(rr.slice(2), "hex")).toLowerCase();
};

export const resolveENSResponse = async (handle: string) => {
  let address = "";
  let ensDomain = "";
  let resolverAddress = "";
  let gtext = [] as any;

  if (isAddress(handle)) {
    if (!isValidEthereumAddress(handle))
      throw new Error(ErrorMessages.invalidAddr, { cause: 404 });

    address = getAddress(handle).toLowerCase();
    ensDomain = await resolveNameFromAddress(handle);
    if (!ensDomain) {
      return {
        address,
        earlyReturnJSON: {
          address: address,
          identity: address,
          platform: PlatformType.ethereum,
          displayName: formatText(address),
          avatar: null,
          email: null,
          description: null,
          location: null,
          header: null,
          links: null,
        },
      };
    }
    resolverAddress = await getResolverAddressFromName(ensDomain);
  } else {
    if (!regexEns.test(handle))
      throw new Error(ErrorMessages.invalidIdentity, { cause: 404 });

    ensDomain = handle;
    const response = await resolveAddressFromName(handle);
    if (!response) throw new Error(ErrorMessages.notExist, { cause: 404 });

    if (response.message) throw new Error(response.message);
    resolverAddress = await getResolverAddressFromName(handle);

    if (!isValidEthereumAddress(resolverAddress))
      throw new Error(ErrorMessages.invalidResolver, { cause: 404 });

    gtext = [response];
    address = await resolveENSCoinTypesValue(
      resolverAddress,
      handle,
      CoinType.eth
    );
    if (!address || !isValidEthereumAddress(address))
      throw new Error(ErrorMessages.invalidResolved, { cause: 404 });
  }

  return {
    address,
    ensDomain,
    resolverAddress,
    earlyReturnJSON: null,
    gtext,
  };
};

export const resolveENSHandle = async (handle: string) => {
  const {
    address,
    ensDomain,
    resolverAddress,
    earlyReturnJSON,
    gtext: originGText,
  } = await resolveENSResponse(handle);
  if (earlyReturnJSON) {
    return earlyReturnJSON;
  }
  if (!isValidEthereumAddress(resolverAddress))
    throw new Error(ErrorMessages.invalidResolver, { cause: 404 });

  let gtext = originGText;

  gtext = !gtext?.length ? await getENSProfile(ensDomain) : gtext;
  let LINKRES = {};
  if (gtext && gtext[0].resolver.texts) {
    const linksRecords = gtext[0]?.resolver?.texts;
    const linksToFetch = linksRecords.reduce(
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
        const key = _.findKey(PlatformData, (o) => {
          return o.ensText?.includes(recordText.toLowerCase());
        });
        const textValue = await resolveENSTextValue(
          resolverAddress,
          ensDomain,
          recordText
        );
        const handle = resolveHandle(textValue, key as PlatformType);

        if (key && handle) {
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

  const headerHandle =
    (await resolveENSTextValue(resolverAddress, ensDomain, "header")) || null;
  const avatarHandle =
    (await resolveENSTextValue(resolverAddress, ensDomain, "avatar")) || null;
  const resJSON = {
    address: address.toLowerCase(),
    identity: ensDomain,
    platform: PlatformType.ens,
    displayName:
      (await resolveENSTextValue(resolverAddress, ensDomain, "name")) ||
      ensDomain,
    avatar: avatarHandle ? await resolveEipAssetURL(avatarHandle) : null,
    email:
      (await resolveENSTextValue(resolverAddress, ensDomain, "email")) || null,
    description:
      (await resolveENSTextValue(resolverAddress, ensDomain, "description")) ||
      null,
    location:
      (await resolveENSTextValue(resolverAddress, ensDomain, "location")) ||
      null,
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
  regions: ["sfo1", "hnd1", "sin1"],
  maxDuration: 45,
  unstable_allowDynamic: [
    "**/node_modules/lodash/**/*.js",
    "**/node_modules/@ensdomain/address-encoder/**/*.js",
    "**/node_modules/js-sha256/**/*.js",
  ],
};
