import type { NextApiRequest } from "next";
import { getAddress, isAddress } from "@ethersproject/address";
import { errorHandle } from "@/utils/base";
import {
  getSocialMediaLink,
  resolveEipAssetURL,
  resolveHandle,
} from "@/utils/resolver";
import _ from "lodash";
import { PlatformType, PlatfomData } from "@/utils/platform";
import { CoinType } from "@/utils/cointype";
import { regexEns } from "@/utils/regexp";
import { ethers } from "ethers";
import { base, resolverABI } from "../../../../utils/resolverABI";
import { formatsByCoinType } from "@ensdomains/address-encoder";

const iface = new ethers.utils.Interface(base);
const resolverFace = new ethers.utils.Interface(resolverABI);

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
      owner {
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
  return res[0];
};

const resolveNameFromAddress = async (address: string) => {
  try {
    const data = iface.encodeFunctionData("getNames", [[address.substring(2)]]);
    const resp = await fetch(ethereumRPCURL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: "1",
        method: "eth_call",
        params: [
          { to: "0x3671aE578E63FdF66ad4F3E12CC0c0d71Ac7510C", data: data },
          "latest",
        ],
      }),
    });
    const res = await resp.text();
    const rr = ethers.utils.defaultAbiCoder.decode(
      [ethers.utils.ParamType.from("string[]")],
      JSON.parse(res)?.result
    );
    return rr[0][0];
  } catch (e) {
    return null;
  }
};

const resolveENSTextValue = async (
  resolverAddress: string,
  name: string,
  text: string
) => {
  try {
    const nodeHash = ethers.utils.namehash(name);
    const data = resolverFace.encodeFunctionData("text", [nodeHash, text]);
    const requestData = {
      jsonrpc: "2.0",
      method: "eth_call",
      params: [
        {
          to: resolverAddress,
          data: data,
        },
        "latest",
      ],
      id: 1,
    };
    const resp = await fetch(ethereumRPCURL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestData),
    });
    const res = await resp.text();

    const rr = ethers.utils.defaultAbiCoder.decode(
      [ethers.utils.ParamType.from("string")],
      JSON.parse(res)?.result
    );
    return rr[0];
  } catch (e) {
    return null;
  }
};

const getENSMetadataAvatar = (domain: string) =>
  "https://metadata.ens.domains/mainnet/avatar/" + domain;

const resolveENSCoinTypesValue = async (
  resolverAddress: string,
  name: string,
  coinType: string | number
) => {
  try {
    const nodeHash = ethers.utils.namehash(name);
    const { encoder } = formatsByCoinType[coinType];
    const data = resolverFace.encodeFunctionData("addr", [nodeHash, coinType]);
    const requestData = {
      jsonrpc: "2.0",
      method: "eth_call",
      params: [
        {
          to: resolverAddress,
          data: data,
        },
        "latest",
      ],
      id: 1,
    };
    const resp = await fetch(ethereumRPCURL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestData),
    });
    const res = await resp.text();
    const rr = ethers.utils.defaultAbiCoder.decode(
      ["bytes"],
      JSON.parse(res)?.result
    )[0];
    if (!rr || rr === "0x") return null;

    return encoder(Buffer.from(rr.slice(2), "hex"));
  } catch (e) {
    return null;
  }
};

const resolveHandleFromURL = async (handle: string | undefined) => {
  if (!handle) return errorHandle("");

  try {
    let address = null;
    let ensDomain = "";
    let resolverAddress = "";
    if (isAddress(handle)) {
      address = getAddress(handle);
      ensDomain = await resolveNameFromAddress(handle);
      if (!ensDomain) {
        return errorHandle(handle);
      }
      resolverAddress = (await resolveAddressFromName(ensDomain))?.resolver
        ?.address;
    } else {
      if (!regexEns.test(handle)) return errorHandle(handle);
      const response = await resolveAddressFromName(handle);
      address = response?.resolvedAddress?.id || response?.owner.id;
      if (!address) return errorHandle(handle);
      ensDomain = handle;
      resolverAddress = response?.resolver?.address;
    }
    if (ensDomain && address) {
      if (!resolverAddress) {
        return new Response(
          JSON.stringify({
            owner: address,
            identity: ensDomain,
            displayName: ensDomain,
            avatar: null,
            email: null,
            description: null,
            location: null,
            header: null,
            links: null,
            addresses: null,
          }),
          {
            status: 503,
            headers: {
              "Cache-Control": `no-store`,
              "Retry-After": "30",
            },
          }
        );
      }
    } else {
      return errorHandle(handle);
    }

    const gtext = await getENSProfile(ensDomain);

    let LINKRES = {};
    let CRYPTORES: { [index: string]: string | null } = {
      eth: address,
      btc: null,
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
              ![CoinType.btc, CoinType.eth].includes(Number(cur)) &&
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
        btc: await resolveENSCoinTypesValue(
          resolverAddress,
          ensDomain,
          CoinType.btc
        ),
        ...(await getCrypto()),
      };
    }
    const headerHandle =
      (await resolveENSTextValue(resolverAddress, ensDomain, "header")) || "";
    const avatarHandle =
      (await resolveENSTextValue(resolverAddress, ensDomain, "avatar")) || "";
    const resJSON = {
      owner: address,
      identity: ensDomain,
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
    }).then((res) => res.json());
    if (fetchRes) return fetchRes.data.domains;
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
