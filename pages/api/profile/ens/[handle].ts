import type { NextApiRequest } from "next";
import { getAddress, isAddress } from "@ethersproject/address";
import { errorHandle, ErrorMessages } from "@/utils/base";
import {
  getSocialMediaLink,
  resolveEipAssetURL,
  resolveHandle,
} from "@/utils/resolver";
import _, { add } from "lodash";
import { PlatformType, PlatfomData } from "@/utils/platform";
import { CoinType } from "@/utils/cointype";
import { regexEns } from "@/utils/regexp";
import { ethers } from "ethers";
import { base, resolverABI } from "../../../../utils/resolverABI";
import { formatsByCoinType } from "@ensdomains/address-encoder";

const iface = new ethers.utils.Interface(base);
const resolverFace = new ethers.utils.Interface(resolverABI);

const isValidEthereumAddress = (address: string) => {
  if (!isAddress(address)) return false; // invalid ethereum address
  if (address.match(/^0x0*$|^0xdead.*$/)) return false; // empty & burn address
  if (address == "0x0000000000000000000000000000000000000001") return false; // ethereum test address
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
      id
      name
      resolver {
        texts
        coinTypes
        address
      }
      owner{
        id
      }
      resolvedAddress{
        id
      }
    }
  }
`;

const ethereumRPCURL =
  process.env.NEXT_PUBLIC_ETHEREUM_RPC_URL || "https://rpc.ankr.com/eth	";

const resolveAddressFromName = async (name: string) => {
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

const resolveNameFromAddress = async (address: string) => {
  const data = iface.encodeFunctionData("getNames", [[address.substring(2)]]);
  return (
    await fetchEthereumRPC({
      data: data,
      to: "0x3671aE578E63FdF66ad4F3E12CC0c0d71Ac7510C",
      decodeType: "string[]",
    })
  )?.[0];
};

const resolveENSTextValue = async (
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

const getENSMetadataAvatar = (domain: string) =>
  "https://metadata.ens.domains/mainnet/avatar/" + domain;

const resolveENSCoinTypesValue = async (
  resolverAddress: string,
  name: string,
  coinType: string | number
) => {
  const nodeHash = ethers.utils.namehash(name);
  const { encoder } = formatsByCoinType[coinType];
  const data = resolverFace.encodeFunctionData("addr", [nodeHash, coinType]);
  const rr = await fetchEthereumRPC({
    data: data,
    to: resolverAddress,
    decodeType: "bytes",
  });
  if (!rr || rr === "0x") return null;

  return encoder(Buffer.from(rr.slice(2), "hex"));
};

const resolveHandleFromURL = async (handle: string | undefined) => {
  if (!handle)
    return errorHandle({
      address: null,
      identity: null,
      platform: PlatformType.ens,
      code: 404,
      message: ErrorMessages.inValidENS,
    });

  try {
    let address = "";
    let ensDomain = "";
    let resolverAddress = "";
    let gtext = [] as any;

    if (isAddress(handle)) {
      if (!isValidEthereumAddress(handle))
        return errorHandle({
          address: handle,
          identity: null,
          platform: PlatformType.ens,
          code: 404,
          message: ErrorMessages.inValidAddr,
        });
      address = getAddress(handle);
      ensDomain = await resolveNameFromAddress(handle);
      if (!ensDomain) {
        return errorHandle({
          address: handle,
          identity: null,
          platform: PlatformType.ens,
          code: 404,
          message: ErrorMessages.notFound,
        });
      }
      resolverAddress = (await resolveAddressFromName(ensDomain))?.resolver
        ?.address;
    } else {
      if (!regexEns.test(handle))
        return errorHandle({
          address: null,
          identity: handle,
          platform: PlatformType.ens,
          code: 404,
          message: ErrorMessages.inValidENS,
        });
      ensDomain = handle;
      const response = await resolveAddressFromName(handle);
      if (response.message) throw new Error(response.message);
      gtext = [response];
      address = response?.resolvedAddress?.id || null;
      const owner = response?.owner?.id;
      if (!address)
        return errorHandle({
          address,
          identity: handle,
          platform: PlatformType.ens,
          code: 404,
          message: owner ? ErrorMessages.noResolver : ErrorMessages.notExist,
        });
      if (!isValidEthereumAddress(address)) {
        return errorHandle({
          address,
          identity: handle,
          platform: PlatformType.ens,
          code: 404,
          message: ErrorMessages.inValidResolved,
        });
      }

      resolverAddress = response?.resolver?.address || null;
    }

    if (!resolverAddress) {
      return errorHandle({
        address,
        identity: ensDomain,
        platform: PlatformType.ens,
        code: 503,
        message: ErrorMessages.noResolver,
        headers: {
          "Retry-After": "30",
        },
      });
    }

    gtext = !gtext?.length ? await getENSProfile(ensDomain) : gtext;

    let LINKRES = {};
    let CRYPTORES: { [index: string]: string | null } = {
      eth: address,
    };
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
          const key = _.findKey(PlatfomData, (o) => {
            return o.ensText?.includes(recordText);
          });
          const handle = resolveHandle(
            (await resolveENSTextValue(
              resolverAddress,
              ensDomain,
              recordText
            )) || ""
          );
          if (key && handle) {
            const resolvedKey =
              key === PlatformType.url ? PlatformType.website : key;
            _linkRes[resolvedKey] = {
              link: getSocialMediaLink(handle, resolvedKey as PlatformType),
              handle: handle,
            };
          }
        }
        return _linkRes;
      };
      LINKRES = await getLink();
    }
    if (gtext && gtext[0].resolver.coinTypes) {
      const getCrypto = async () => {
        const cryptoRecrods = gtext[0].resolver.coinTypes;
        const cryptoRecordsToFetch = cryptoRecrods.reduce(
          (pre: Array<number>, cur: number) => {
            if (
              ![CoinType.eth].includes(Number(cur)) &&
              _.findKey(CoinType, (o) => o == cur)
            )
              pre.push(cur);
            return pre;
          },
          []
        );
        const _cryptoRes: { [index: string]: string | null } = {};
        for (let i = 0; i < cryptoRecordsToFetch.length; i++) {
          const _coinType = cryptoRecordsToFetch[i];
          const key = _.findKey(CoinType, (o) => {
            return o == _coinType;
          });
          if (key) {
            _cryptoRes[key] =
              (await resolveENSCoinTypesValue(
                resolverAddress,
                ensDomain,
                _coinType
              )) || null;
          }
        }
        return _cryptoRes;
      };
      CRYPTORES = {
        eth: address,
        ...(await getCrypto()),
      };
    }
    const headerHandle =
      (await resolveENSTextValue(resolverAddress, ensDomain, "header")) || "";
    const avatarHandle =
      (await resolveENSTextValue(resolverAddress, ensDomain, "avatar")) || "";
    const resJSON = {
      address,
      identity: ensDomain,
      platform: PlatfomData.ENS.key,
      displayName:
        (await resolveENSTextValue(resolverAddress, ensDomain, "name")) ||
        ensDomain,
      avatar: avatarHandle
        ? (await resolveEipAssetURL(avatarHandle)) ||
          getENSMetadataAvatar(ensDomain)
        : null,
      email:
        (await resolveENSTextValue(resolverAddress, ensDomain, "email")) ||
        null,
      description:
        (await resolveENSTextValue(
          resolverAddress,
          ensDomain,
          "description"
        )) || null,
      location:
        (await resolveENSTextValue(resolverAddress, ensDomain, "location")) ||
        null,
      header: (await resolveEipAssetURL(headerHandle)) || null,
      links: LINKRES,
      addresses: CRYPTORES,
    };
    return new Response(JSON.stringify(resJSON), {
      status: 200,
      headers: {
        "Cache-Control": `public, s-maxage=${
          60 * 60 * 24 * 7
        }, stale-while-revalidate=${60 * 30}`,
      },
    });
  } catch (error: any) {
    return new Response(
      JSON.stringify({
        identity: handle,
        platform: PlatfomData.ENS.key,
        error: error.message,
      }),
      {
        status: 500,
        headers: {
          "Cache-Control": `no-store`,
        },
      }
    );
  }
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
      headers: {
        "Cache-Control": "max-age=86400, must-revalidate",
      },
    }).then((res) => res.json());

    if (fetchRes) return fetchRes.data?.domains || fetchRes.errors;
  } catch (e) {
    return null;
  }
};

export default async function handler(req: NextApiRequest) {
  const { searchParams } = new URL(req.url as string);
  const inputAddress = searchParams.get("handle");
  const lowercaseAddress = inputAddress?.toLowerCase();

  return resolveHandleFromURL(lowercaseAddress);
}

export const config = {
  runtime: "edge",
  unstable_allowDynamic: [
    "**/node_modules/lodash/**/*.js",
    "**/node_modules/@ensdomain/address-encoder/**/*.js",
    "**/node_modules/js-sha256/**/*.js",
  ],
};
