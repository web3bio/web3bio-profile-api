import { isValidEthereumAddress } from "@/utils/base";
import { getSocialMediaLink, resolveHandle } from "@/utils/resolver";
import { PlatformType } from "@/utils/platform";
import { regexEns } from "@/utils/regexp";
import { createPublicClient, http } from "viem";
import { mainnet } from "viem/chains";
import { normalize } from "viem/ens";
import { ErrorMessages } from "@/utils/types";

export const enum FarcasterQueryParamType {
  username = "username",
  connected_address = "connected_address",
}

const originBase = "https://api.warpcast.com/v2/";
const regexTwitterLink = /(\S*)(.|@)twitter/i;

const fetcher = (url: string) => {
  return fetch(url, {
    headers: {
      Authorization: process.env.NEXT_PUBLIC_FARCASTER_API_KEY || "",
    },
  });
};

const client = createPublicClient({
  chain: mainnet,
  transport: http(process.env.NEXT_PUBLIC_ETHEREUM_RPC_URL),
}) as any;

const fetchWarpcastWithAddress = async (address: string) => {
  try {
    const res = await fetcher(
      originBase + `user-by-verification?address=${address}`
    ).then((res) => res.json());
    return res;
  } catch (e) {
    console.log(e);
    return null;
  }
};

const fetchFidFromWarpcastWithUsername = async (uname: string) => {
  try {
    const res = await fetcher(
      originBase + `user-by-username?username=${uname}`
    ).then((res) => res.json());
    return res;
  } catch (e) {
    console.log(e);
    return null;
  }
};

const fetchAddressesFromWarpcastWithFid = async (fid: string) => {
  const res = await fetcher(originBase + `verifications?fid=${fid}`).then(
    (res) => res.json()
  );
  if (res?.result?.verifications?.length == 0) return null;
  return (
    res.result.verifications.find(
      (x: { protocol: PlatformType }) => x.protocol === PlatformType.ethereum
    )?.address || res.result.verifications[0].address
  );
};

const resolveFarcasterLinks = (
  response: {
    username: string;
    profile: { bio: { text: string | null } };
  },
  resolvedHandle: string | null
) => {
  const LINKRES: {
    [key in PlatformType.twitter | PlatformType.farcaster]?: {
      link: string | null;
      handle: string | null;
    };
  } = resolvedHandle
    ? {
        farcaster: {
          link: getSocialMediaLink(resolvedHandle, PlatformType.farcaster),
          handle: resolvedHandle,
        },
      }
    : {};
  const bioText = response.profile.bio.text || "";
  const twitterMatch = bioText.match(regexTwitterLink);
  if (twitterMatch) {
    const matched = twitterMatch[1];
    const resolveMatch = resolveHandle(matched, PlatformType.farcaster);
    LINKRES[PlatformType.twitter] = {
      link: getSocialMediaLink(resolveMatch, PlatformType.twitter),
      handle: resolveMatch,
    };
  }

  return LINKRES;
};

export const resolveFarcasterResponse = async (handle: string) => {
  let response;
  if (isValidEthereumAddress(handle)) {
    const user = (await fetchWarpcastWithAddress(handle))?.result?.user;
    const address = await fetchAddressesFromWarpcastWithFid(user?.fid);
    response = {
      address,
      ...user,
    };
    if (!response?.username)
      throw new Error(ErrorMessages.notFound, { cause: 404 });
  } else {
    const rawUser = (await fetchFidFromWarpcastWithUsername(handle))?.result
      ?.user;
    if (!rawUser?.fid) throw new Error(ErrorMessages.notFound, { cause: 404 });

    const address = await fetchAddressesFromWarpcastWithFid(rawUser?.fid);

    const ethAddress =
      !address && regexEns.test(handle)
        ? await client.getEnsAddress({
            name: normalize(handle),
          })
        : null || "";
    response = {
      address: (address || ethAddress)?.toLowerCase(),
      ...rawUser,
    };
  }
  return response;
};

export const resolveFarcasterHandle = async (handle: string) => {
  const response = await resolveFarcasterResponse(handle);
  if (!response?.fid) throw new Error(ErrorMessages.notFound, { cause: 404 });
  const resolvedHandle = resolveHandle(response.username);
  const links = resolveFarcasterLinks(response, resolvedHandle);
  const resJSON = {
    address: response.address || null,
    identity: response.username,
    platform: PlatformType.farcaster,
    displayName: response.displayName || response.username,
    avatar: response.pfp.url,
    description: response.profile.bio.text || null,
    email: null,
    location: response?.profile.location.description || null,
    header: null,
    contenthash: null,
    links: links,
  };
  return resJSON;
};