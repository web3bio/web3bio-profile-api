import type { NextApiRequest, NextApiResponse } from "next";
import { StaticJsonRpcProvider } from "@ethersproject/providers";
import { getAddress, isAddress } from "@ethersproject/address";
import {
  HandleNotFoundResponseData,
  HandleResponseData,
  errorHandle,
} from "@/utils/base";
import {
  getSocialMediaLink,
  resolveEipAssetURL,
  resolveHandle,
} from "@/utils/resolver";
import _ from "lodash";
import { gql } from "@apollo/client";
import { PlatformType, platfomData } from "@/utils/platform";
import { CoinType } from "@/utils/ens";
import client from "@/utils/apollo";
import { regexEns } from "@/utils/regexp";

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

const getENSRecordsQuery = gql`
  query Profile($name: String) {
    domains(where: { name: $name }) {
      id
      name
      resolver {
        texts
        coinTypes
      }
    }
  }
`;

const provider = new StaticJsonRpcProvider(
  process.env.NEXT_PUBLIC_ETHEREUM_RPC_URL
);

const resolveHandleFromURL = async (
  handle: string,
  res: NextApiResponse<HandleResponseData | HandleNotFoundResponseData>
) => {
  try {
    let address = null;
    let ensDomain = null;
    let avatar = null;
    if (isAddress(handle)) {
      address = getAddress(handle);
      ensDomain = (await provider.lookupAddress(address)) || null;
      if (!ensDomain) {
        return errorHandle(handle, res);
      }
      avatar = (await provider.getAvatar(ensDomain)) || null;
    } else {
      if (!regexEns.test(handle)) return errorHandle(handle, res);
      [address, avatar] = await Promise.all([
        provider.resolveName(handle),
        provider.getAvatar(handle),
      ]);
      if (!address) return errorHandle(handle, res);
      ensDomain = handle;
    }

    const gtext = await getENSTexts(ensDomain);
    const resolver = await provider.getResolver(ensDomain);
    if (!resolver) {
      return errorHandle(handle, res);
    }
    let LINKRES = {};
    let CRYPTORES: { [index: string]: string | null } = {
      eth: address,
      btc: null,
    };
    if (gtext && gtext[0].resolver.texts) {
      const linksRecords = gtext[0].resolver.texts;
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

          const key =
            _.findKey(platfomData, (o) => {
              return o.ensText?.includes(recordText);
            }) || recordText;
          const handle = resolveHandle(
            (await resolver.getText(recordText)) || ""
          );
          if (handle) {
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
    if (gtext && gtext[0].resolver.coinTypes) {
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
      const getCrypto = async () => {
        const _cryptoRes: { [index: string]: string | null } = {};
        for (let i = 0; i < cryptoRecordsToFetch.length; i++) {
          const _coinType = cryptoRecordsToFetch[i];
          const key = _.findKey(CoinType, (o) => {
            return o == _coinType;
          });
          if (key) {
            _cryptoRes[key] = (await resolver.getAddress(_coinType)) || null;
          }
        }
        return _cryptoRes;
      };
      CRYPTORES = {
        eth: address,
        btc: await resolver.getAddress(CoinType.btc),
        ...(await getCrypto()),
      };
    }
    const headerHandle = (await resolver.getText("header")) || null;
    const resJSON = {
      owner: address,
      identity: ensDomain,
      displayName: (await resolver.getText("name")) || ensDomain,
      avatar: (await resolveEipAssetURL(avatar || "")) || null,
      email: (await resolver.getText("email")) || null,
      description: (await resolver.getText("description")) || null,
      location: (await resolver.getText("location")) || null,
      header: (await resolveEipAssetURL(headerHandle || "")) || null,
      links: LINKRES,
      addresses: CRYPTORES,
    };

    res
      .status(200)
      .setHeader(
        "Cache-Control",
        `public, s-maxage=${60 * 60 * 24 * 7}, stale-while-revalidate=${
          60 * 30
        }`
      )
      .json(resJSON);
  } catch (error: any) {
    res.status(500).json({
      identity: isAddress(handle) ? handle : null,
      error: error.message,
    });
  }
};

export const getENSTexts = async (name: string) => {
  const fetchRes = await client.query({
    query: getENSRecordsQuery,
    variables: {
      name,
    },
  });
  if (fetchRes) return fetchRes.data.domains;
  return null;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<HandleResponseData | HandleNotFoundResponseData>
) {
  const inputAddress = req.query.handle as string;
  return resolveHandleFromURL(inputAddress.toLowerCase(), res);
}
